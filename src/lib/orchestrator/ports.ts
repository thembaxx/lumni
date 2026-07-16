import type { Question } from "@/lib/question-engine/types";

/** Port for checking if a question is a duplicate of existing content. */
export interface DedupPort {
  isDuplicate(question: Question, subject: string): Promise<boolean>;
}

import { embedText } from "@/lib/embedding/client";
import { findTopK } from "@/lib/embedding/similarity";
import type { EmbeddingDataAccess, LegacyDataAccess } from "@/lib/db/data-access";
import { logError } from "@/lib/shared/logger";

export class EmbeddingDedup implements DedupPort {
  private db: EmbeddingDataAccess & Pick<LegacyDataAccess, "pastPaperQuestions">;

  constructor(db: EmbeddingDataAccess & Pick<LegacyDataAccess, "pastPaperQuestions">) {
    this.db = db;
  }

  async isDuplicate(question: Question, subject: string): Promise<boolean> {
    try {
      const embedding = await embedText(question.questionText);
      if (!embedding) return false;
      const top = await findTopK(
        {
          subject,
          queryEmbedding: new Float32Array(embedding),
          k: 1,
          threshold: 0.85,
        },
        {
          questionEmbeddings: this.db.questionEmbeddings,
          pastPaperQuestions: this.db.pastPaperQuestions,
        },
      );
      return top.length > 0;
    } catch (e) {
      logError("EmbeddingDedup", e);
      return false;
    }
  }
}

import { curriculumRegistry } from "@/curriculum";
import { competencyService, computeBloomWeight } from "@/lib/competency-engine";
import type { BloomLevel, UserAnswer } from "@/lib/question-engine/types";
import { enqueue } from "./job-queue";

export interface GradeSideEffectParams {
  subject: string;
  topic: string;
  bloomLevel: BloomLevel;
  questionType: string;
  score: number;
  maxScore: number;
  correct: boolean;
  question?: Question;
  paperId?: string;
}

export interface GradingPipelineDeps {
  enqueueSideEffects(params: GradeSideEffectParams): Promise<void>;
}

export class GradingPipeline {
  private deps: GradingPipelineDeps;

  constructor(deps?: GradingPipelineDeps) {
    this.deps = deps ?? { enqueueSideEffects: enqueueGradeSideEffects };
  }

  async grade(
    grade: (
      q: Question,
      a: UserAnswer,
    ) => Promise<{ score: number; maxScore: number; correct: boolean }>,
    question: Question,
    answer: UserAnswer,
  ): Promise<{ score: number; maxScore: number; correct: boolean }> {
    const result = await grade(question, answer);
    await this.deps.enqueueSideEffects({
      subject: question.subject,
      topic: question.topic,
      bloomLevel: question.bloomTaxonomy,
      questionType: question.type,
      score: result.score,
      maxScore: result.maxScore,
      correct: result.correct,
      question,
    });
    return result;
  }
}

export async function enqueueGradeSideEffects(params: GradeSideEffectParams): Promise<void> {
  const { subject, topic, bloomLevel, questionType, score, maxScore, correct, question } = params;

  const percentage = maxScore > 0 ? (score / maxScore) * 100 : score;
  const isCorrect = correct ?? (maxScore > 0 ? score / maxScore >= 0.5 : score >= 0.5);

  const curriculum = await curriculumRegistry.getSubject(subject);
  const weight = curriculum ? computeBloomWeight(curriculum, topic, bloomLevel) : 1;

  const jobs = [
    competencyService.update(subject, topic, bloomLevel, percentage, weight, params.paperId),
    enqueue("analytics-sync", {
      events: [
        {
          event: "grade",
          timestamp: Date.now(),
          subject,
          questionType,
          success: isCorrect,
          duration: 0,
        },
      ],
    }),
    enqueue("progress-update", {
      subject,
      result: { correct: isCorrect, score },
    }),
  ];

  if (question) {
    jobs.push(
      enqueue("spaced-rep-update", {
        question,
        result: { correct: isCorrect, score },
      }),
    );
  }

  await Promise.all(jobs);
}

export interface PipelinePort {
  enqueueJob(type: string, payload: unknown): Promise<number>;
}

export const defaultPipelinePort: PipelinePort = {
  enqueueJob: async (type, payload) =>
    enqueue(type as Parameters<typeof enqueue>[0], payload as never),
};
