import { dexieDataAccess } from "@/lib/db";
import type { EmbeddingDataAccess, LegacyDataAccess } from "@/lib/db/data-access";
import { QuestionEngine } from "@/lib/question-engine/question-engine";
import type { GenerationParams, Question, UserAnswer } from "@/lib/question-engine/types";
import { serializeQuestionType } from "@/lib/shared/question-type";
import { trackEngineEvent } from "@/lib/utils/engine-analytics";
import {
  EmbeddingDedup,
  enqueueGradeSideEffects,
  type DedupPort,
  type GradingPipelineDeps,
  type PipelinePort,
  defaultPipelinePort,
} from "./ports";
import type { GenerateResult, GradeResult } from "./types";

export class LearningOrchestrator {
  private engine: QuestionEngine;
  private dedup: DedupPort;
  private gradingDeps: GradingPipelineDeps;
  private pipeline: PipelinePort;

  constructor(
    engine: QuestionEngine,
    deps?: {
      db?: EmbeddingDataAccess & Pick<LegacyDataAccess, "pastPaperQuestions">;
      dedup?: DedupPort;
      gradingDeps?: GradingPipelineDeps;
      pipeline?: PipelinePort;
    },
  ) {
    const db = deps?.db ?? dexieDataAccess;
    this.engine = engine;
    this.dedup = deps?.dedup ?? new EmbeddingDedup(db);
    this.gradingDeps = deps?.gradingDeps ?? { enqueueSideEffects: enqueueGradeSideEffects };
    this.pipeline = deps?.pipeline ?? defaultPipelinePort;
  }

  static async initialize(): Promise<LearningOrchestrator> {
    const engine = await QuestionEngine.initialize();
    return new LearningOrchestrator(engine);
  }

  async generateQuestionSet(params: GenerationParams): Promise<GenerateResult> {
    const startTime = Date.now();
    const { questionType, subject, topic, count } = params;

    let rawQuestions: Question[] = [];
    let ragContext: { sources?: { url: string; title: string }[] } | null = null;
    try {
      const result = await this.engine.generate(params);
      rawQuestions = result.questions;
      ragContext = result.ragContext;
    } catch {
      rawQuestions = [];
    }
    let questions: Question[] = rawQuestions;

    const poolQuestions = questions.filter((q) => q.metadata?.source === "imported");
    const aiQuestions = questions.filter((q) => q.metadata?.source !== "imported");
    const dedupResults = await Promise.all(
      aiQuestions.map(async (q) => {
        try {
          return await this.dedup.isDuplicate(q, subject);
        } catch {
          return false;
        }
      }),
    );
    const aiDeduped = aiQuestions.filter((_, i) => !dedupResults[i]);
    questions = [...poolQuestions, ...aiDeduped].slice(0, count);

    const jobResults = await Promise.all([
      (async () => {
        try {
          return await this.pipeline.enqueueJob("appwrite-sync", { questions, subject, topic });
        } catch {
          return -1;
        }
      })(),
      ...questions.map(async (q) => {
        try {
          return await this.pipeline.enqueueJob("visual-generation", {
            questionId: q.id,
            questionText: q.questionText,
            subject,
            topic,
          });
        } catch {
          return -1;
        }
      }),
    ]);
    const jobIds = jobResults.filter((id): id is number => id !== -1);

    trackEngineEvent({
      event: "generate",
      subject,
      questionType: serializeQuestionType(questionType),
      count: questions.length,
      success: true,
      duration: Date.now() - startTime,
    });

    const sources: { url: string; title: string }[] =
      ragContext?.sources?.map((s: { url: string; title: string }) => ({
        url: s.url,
        title: s.title,
      })) ?? [];

    return {
      questions,
      count: questions.length,
      type: serializeQuestionType(questionType),
      jobIds,
      sources,
    };
  }

  async gradeAndTrack(question: Question, answer: UserAnswer): Promise<GradeResult> {
    const startTime = Date.now();

    const result = await this.engine.grade(question, answer);

    await this.gradingDeps.enqueueSideEffects({
      subject: question.subject,
      topic: question.topic,
      bloomLevel: question.bloomTaxonomy,
      questionType: question.type,
      score: result.score,
      maxScore: result.maxScore,
      correct: result.correct,
      question,
    });

    trackEngineEvent({
      event: "grade",
      subject: question.subject,
      questionType: question.type,
      success: true,
      duration: Date.now() - startTime,
    });

    return { result, jobIds: [] };
  }
}
