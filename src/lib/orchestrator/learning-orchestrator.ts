import { Effect } from "effect";
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

  generateQuestionSetEffect(params: GenerationParams): Effect.Effect<GenerateResult> {
    // oxlint-disable-next-line typescript/no-this-alias
    const self = this;
    const startTime = Date.now();
    const { questionType, subject, topic, count } = params;

    return Effect.gen(function* () {
      const { questions: rawQuestions, ragContext } = yield* Effect.tryPromise(() =>
        self.engine.generate(params),
      ).pipe(
        Effect.catchAll(() => Effect.succeed({ questions: [] as Question[], ragContext: null })),
      );
      let questions: Question[] = rawQuestions;

      const poolQuestions = questions.filter((q) => q.metadata?.source === "imported");
      const aiQuestions = questions.filter((q) => q.metadata?.source !== "imported");
      const dedupResults = yield* Effect.all(
        aiQuestions.map((q) =>
          Effect.tryPromise(() => self.dedup.isDuplicate(q, subject)).pipe(
            Effect.catchAll(() => Effect.succeed(false)),
          ),
        ),
        { concurrency: "unbounded" },
      );
      const aiDeduped = aiQuestions.filter((_, i) => !dedupResults[i]);
      questions = [...poolQuestions, ...aiDeduped].slice(0, count);

      const jobs = yield* Effect.all(
        [
          Effect.tryPromise(() =>
            self.pipeline.enqueueJob("appwrite-sync", { questions, subject, topic }),
          ).pipe(Effect.catchAll(() => Effect.succeed(-1))),
          ...questions.map((q) =>
            Effect.tryPromise(() =>
              self.pipeline.enqueueJob("visual-generation", {
                questionId: q.id,
                questionText: q.questionText,
                subject,
                topic,
              }),
            ).pipe(Effect.catchAll(() => Effect.succeed(-1))),
          ),
        ],
        { concurrency: "unbounded" },
      );
      const jobIds = jobs.filter((id): id is number => id !== -1);

      yield* Effect.sync(() =>
        trackEngineEvent({
          event: "generate",
          subject,
          questionType: serializeQuestionType(questionType),
          count: questions.length,
          success: true,
          duration: Date.now() - startTime,
        }),
      );

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
    });
  }

  async generateQuestionSet(params: GenerationParams): Promise<GenerateResult> {
    return Effect.runPromise(this.generateQuestionSetEffect(params));
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
