import { Query } from "appwrite";
import { dexieDataAccess } from "@/lib/db";
import { APPWRITE_DATABASE_ID, COLLECTIONS, listDocuments, updateDocument } from "@/lib/db/client";
import type { CacheDataAccess, EmbeddingDataAccess, QuizDataAccess } from "@/lib/db/data-access";
import type { CachedProgress } from "@/lib/db/types";
import { flashcardEngine } from "@/lib/flashcard-engine";
import { enqueue } from "@/lib/orchestrator/job-queue";
import type { JobPayloadByType } from "@/lib/orchestrator/types";
import { logError } from "@/lib/shared/logger";
import { extractCorrectAnswer } from "@/lib/shared/question-utils";
import { visualEngine } from "@/lib/visual-engine/visual-engine";
import { quizPackService } from "@/lib/quiz-packs";
import { QuestionEngine } from "@/lib/question-engine/question-engine";
import { createJobHandler } from "./sync-factory";
import type { JobHandler } from "./index";

type DomainDb = EmbeddingDataAccess &
  Pick<QuizDataAccess, "questions"> &
  Pick<CacheDataAccess, "deprecatedQuestions">;
let _deps: { db: DomainDb } = Object.freeze({ db: dexieDataAccess });
export function __setDepsForTesting(deps: { db: DomainDb }) {
  _deps = Object.freeze({ ...deps });
}

const _analyticsSync = async (payload: unknown) => {
  const { databases } = await import("@/lib/appwrite.server");
  const { events } = payload as JobPayloadByType["analytics-sync"];
  const batchSize = 50;
  const batchPromises = [];
  for (let i = 0; i < events.length; i += batchSize) {
    const batch = events.slice(i, i + batchSize);
    batchPromises.push(
      Promise.allSettled(
        batch.map((event) =>
          databases
            .createDocument(APPWRITE_DATABASE_ID, "analytics", "unique()", {
              event: JSON.stringify(event),
              createdAt: new Date().toISOString(),
            })
            .catch((e: Error) => logError("AnalyticsWrite", e)),
        ),
      ),
    );
  }
  await Promise.all(batchPromises);
};

export const analyticsSync = createJobHandler("analyticsSync", _analyticsSync, {
  usePersist: true,
});

async function _saveProgress(
  odSubjectId: string,
  data: {
    questionsAttempted: number;
    correctCount: number;
    currentStreak: number;
    longestStreak: number;
  },
  userId?: string,
): Promise<number> {
  const existing = await dexieDataAccess.progress.where("odSubjectId").equals(odSubjectId).first();
  if (existing?.id != null) {
    return dexieDataAccess.progress.update(existing.id, { ...data, updatedAt: Date.now() });
  }
  return dexieDataAccess.progress.add({ odSubjectId, userId, ...data, updatedAt: Date.now() });
}

async function _getProgress(
  odSubjectId: string,
  userId?: string,
): Promise<CachedProgress | undefined> {
  const item = await dexieDataAccess.progress.where("odSubjectId").equals(odSubjectId).first();
  if (!item) return undefined;
  if (userId && item.userId && item.userId !== userId) return undefined;
  return item;
}

const _spacedRepUpdate = async (payload: unknown) => {
  const { question, result } = payload as JobPayloadByType["spaced-rep-update"];

  const quality = result.correct
    ? result.score >= 0.9
      ? 5
      : result.score >= 0.7
        ? 4
        : 3
    : result.score >= 0.5
      ? 2
      : result.score >= 0.25
        ? 1
        : 0;

  const allCards = await flashcardEngine.getAll(question.subject);
  const existingCards = allCards.filter((c) => c.front === question.questionText);

  if (existingCards.length > 0) {
    await flashcardEngine.review(existingCards[0].id, quality);
  } else {
    const correctOptionText = extractCorrectAnswer(question);
    await flashcardEngine.create(
      question.questionText,
      correctOptionText || question.explanation,
      question.subject,
      question.topic,
    );
  }
};

export const spacedRepUpdate = createJobHandler("spacedRepUpdate", _spacedRepUpdate);

const _progressUpdate = async (payload: unknown) => {
  const { subject, result } = payload as JobPayloadByType["progress-update"];

  const existing = await _getProgress(subject);

  const questionsAttempted = (existing?.questionsAttempted ?? 0) + 1;
  const correctCount = (existing?.correctCount ?? 0) + (result.correct ? 1 : 0);
  const currentStreak = result.correct ? (existing?.currentStreak ?? 0) + 1 : 0;
  const longestStreak = Math.max(existing?.longestStreak ?? 0, currentStreak);

  await Promise.all([
    _saveProgress(subject, {
      questionsAttempted,
      correctCount,
      currentStreak,
      longestStreak,
    }),
    enqueue("appwrite-progress-sync", {
      odSubjectId: subject,
      userId: "",
      questionsAttempted,
      correctCount,
      currentStreak,
      longestStreak,
    }),
  ]);
};

export const progressUpdate = createJobHandler("progressUpdate", _progressUpdate);

const _visualGeneration = async (payload: unknown) => {
  const { questionId, questionText, subject, topic } =
    payload as JobPayloadByType["visual-generation"];
  await visualEngine.resolve({
    questionId,
    questionText,
    subject,
    topic: topic ?? "",
  });
};

export const visualGeneration = createJobHandler("visualGeneration", _visualGeneration);

const _questionRegen = async (payload: unknown) => {
  const data = payload as JobPayloadByType["question-regen"];

  const existingDocs = await listDocuments<Record<string, unknown>>(COLLECTIONS.QUESTIONS, [
    Query.equal("$id", data.questionId),
  ]);

  if (existingDocs.length === 0) return;

  const existing = existingDocs[0];
  const currentText = (existing.questionText as string) || "";
  const currentTopic = (existing.topicId as string) || "";
  const currentType = (existing.type as string) || "";

  const { getAI } = await import("@/lib/ai/client");
  const ai = getAI();
  const result = await ai.generateWithSystem(
    "You are a question regeneration assistant. Improve the quality of the given question while keeping the same topic, type, and difficulty.",
    `Regenerate this question to improve its quality:\n\nSubject: ${data.subject}\nTopic: ${currentTopic}\nType: ${currentType}\nCurrent question: ${currentText}`,
  );

  if (!("content" in result) || !result.content) {
    logError(
      "JobProcessor.RegenFailed",
      new Error(`AI regen failed for question: ${data.questionId}`),
    );
    return;
  }

  const newText = result.content.trim();

  if (newText.length < 10) {
    logError(
      "JobProcessor.RegenTooShort",
      new Error(`Regenerated question too short, skipping: ${data.questionId}`),
    );
    return;
  }

  if (newText === currentText) {
    logError("JobProcessor.RegenUnchanged", new Error(`Question ${data.questionId} unchanged`));
    return;
  }

  await updateDocument(COLLECTIONS.QUESTIONS, data.questionId, {
    questionText: newText,
    updatedAt: new Date().toISOString(),
  });
};

export const questionRegen = createJobHandler("questionRegen", _questionRegen);

const PRUNE_CONFIG = {
  maxAgeDays: 30,
  minRatingCount: 0,
};

const _pruneStaleQuestions = async () => {
  const cutoff = Date.now() - PRUNE_CONFIG.maxAgeDays * 24 * 60 * 60 * 1000;
  const all = await _deps.db.questions.toArray();

  const stale = all.filter((q) => {
    const parsed = safeParseQuestions(q.questions);
    if (!parsed) return false;
    return parsed.some((pq) => {
      const p = pq as Record<string, unknown>;
      const createdAt = p.createdAt as number | undefined;
      const ratingCount = p.ratingCount as number | undefined;
      return (
        createdAt &&
        createdAt < cutoff &&
        (!ratingCount || ratingCount <= PRUNE_CONFIG.minRatingCount)
      );
    });
  });

  if (stale.length === 0) return;

  await Promise.all(
    stale.map((entry) => {
      if (entry.id != null) {
        return _deps.db.questions.delete(entry.id);
      }
      return Promise.resolve();
    }),
  );
};

export const pruneStaleQuestions = createJobHandler("pruneStaleQuestions", _pruneStaleQuestions);

const _deprecateLowQuality = async () => {
  const { questionRatingService } = await import("@/lib/services/question-rating-service");
  const result = await questionRatingService.getLowRatedQuestions(2.5, 10);
  if (!result.success || !result.data) return;

  for (const item of result.data) {
    try {
      await _deps.db.deprecatedQuestions.put({
        questionId: item.questionId,
        deprecatedAt: Date.now(),
      } as never);
    } catch (err) {
      logError("DeprecateLowQualityQuestion", err);
    }
  }
};

export const deprecateLowQuality = createJobHandler("deprecateLowQuality", _deprecateLowQuality);

const _generateEmbedding = async (payload: unknown) => {
  const { questionId, questionText, subject } = payload as JobPayloadByType["generate-embedding"];
  const [{ embedText }, { storeEmbedding }] = await Promise.all([
    import("@/lib/embedding/client"),
    import("@/lib/embedding/cache"),
  ]);
  const values = await embedText(questionText);
  if (!values) {
    logError("Embedding.GenerateFailed", new Error(`Failed embedding for ${questionId}`));
    return;
  }
  await storeEmbedding(
    {
      id: questionId,
      questionId,
      vector: new Float32Array(values),
      subject,
      updatedAt: new Date().toISOString(),
    },
    _deps.db.questionEmbeddings,
  );
};

export const generateEmbedding = createJobHandler("generateEmbedding", _generateEmbedding);

const _quizPackGenerate = async (payload: unknown) => {
  const {
    packId,
    subject,
    topic,
    count,
    generateVisuals = true,
  } = payload as JobPayloadByType["quiz-pack-generate"];

  const engine = await QuestionEngine.initialize();
  const topicParam = topic ?? undefined;

  // Generate questions in batches of 20
  const batchSize = 20;
  const allQuestions: Awaited<ReturnType<typeof engine.generate>>["questions"] = [];
  let remainingCount = count;

  while (remainingCount > 0) {
    const currentBatch = Math.min(batchSize, remainingCount);
    const { questions } = await engine.generate({
      subject,
      topic: topicParam,
      count: currentBatch,
      questionType: "any",
    });
    allQuestions.push(...questions);
    remainingCount -= currentBatch;
  }

  // Store questions
  const questionData = allQuestions.map((q, i) => ({
    questionIndex: i,
    questionText: q.questionText,
    options: JSON.stringify("options" in q.body ? q.body.options : []),
    correctAnswer: extractCorrectAnswer(q) ?? "",
    explanation: q.explanation ?? null,
    difficulty: q.difficulty ?? "Medium",
    type: q.type,
  }));

  await quizPackService.storeQuestions(packId, questionData);

  // Pre-generate visual assets if requested
  let visualAssetsGenerated = 0;
  let visualBytes = 0;

  if (generateVisuals) {
    const visualAssets: Array<{
      questionIndex: number;
      assetId: string;
      assetType: string;
      assetData: string;
    }> = [];

    for (let i = 0; i < allQuestions.length; i++) {
      try {
        const question = allQuestions[i];
        const visual = await visualEngine.resolve({
          questionId: question.id,
          questionText: question.questionText,
          subject,
          topic: topicParam ?? "",
        });

        if (visual && visual.type) {
          const assetId = `visual_${Date.now()}_${i}`;
          visualAssets.push({
            questionIndex: i,
            assetId,
            assetType: visual.type,
            assetData: JSON.stringify(visual),
          });
          visualAssetsGenerated++;
        }
      } catch (e) {
        logError(`QuizPackVisualGen.Question${i}`, e);
      }
    }

    if (visualAssets.length > 0) {
      visualBytes = await quizPackService.storeVisualAssets(packId, visualAssets);
      await quizPackService.markVisualAssetsReady(packId, visualAssetsGenerated, visualBytes);
    }
  }

  const storageBytes = new TextEncoder().encode(JSON.stringify(questionData)).length + visualBytes;
  await quizPackService.markReady(packId, storageBytes);
};

export const quizPackGenerate = createJobHandler("quizPackGenerate", _quizPackGenerate);

function safeParseQuestions(json: string): unknown[] | null {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export const domainHandlers: Partial<Record<string, JobHandler>> = {
  "analytics-sync": analyticsSync,
  "spaced-rep-update": spacedRepUpdate,
  "progress-update": progressUpdate,
  "visual-generation": visualGeneration,
  "question-regen": questionRegen,
  "prune-stale-questions": pruneStaleQuestions,
  "deprecate-low-quality-questions": deprecateLowQuality,
  "generate-embedding": generateEmbedding,
  "quiz-pack-generate": quizPackGenerate,
};
