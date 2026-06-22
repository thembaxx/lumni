import { curriculumRegistry } from "@/curriculum";
import { competencyService, computeBloomWeight } from "@/lib/competency-engine";
import type { BloomLevel, Question } from "@/lib/question-engine/types";
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
