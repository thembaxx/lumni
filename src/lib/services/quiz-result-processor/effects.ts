import { Effect } from "effect";
import type { QuizResultDeps, ExamPartResult } from "./types";

export function flashcardCreateEffect(
  deps: QuizResultDeps,
  front: string,
  back: string,
  subject: string,
  topic?: string,
): Effect.Effect<void> {
  return Effect.tryPromise(() => deps.flashcardEngine.create(front, back, subject, topic)).pipe(
    Effect.catchAll(() => Effect.void),
  );
}

export function flashcardReviewEffect(
  deps: QuizResultDeps,
  id: string,
  quality: number,
): Effect.Effect<void> {
  return Effect.tryPromise(() => deps.flashcardEngine.review(id, quality)).pipe(
    Effect.catchAll(() => Effect.void),
  );
}

export function getCorrectAnswerText(part: ExamPartResult["part"]): string {
  if (part.options) {
    const correct = part.options.find((o) => o.isCorrect);
    return correct ? `${correct.id}. ${correct.text}` : "";
  }
  return "";
}
