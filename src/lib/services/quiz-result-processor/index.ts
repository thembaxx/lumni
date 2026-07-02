import { Effect } from "effect";
import { processBoltEffect } from "./bolt";
import { processQuizEffect } from "./quiz";
import { processExamEffect } from "./exam";
import { processFlashcardEffect } from "./flashcard";
import type { QuizResultInput, QuizResultDeps } from "./types";

export type { QuizResultInput, QuizResultDeps, WrongAnswerInput, TrackResultInput, RetentionInput, FlashcardEngine, BoltResult, QuizResults, ExamPartResult, FlashcardItem } from "./types";

function processQuizResultEffect(
  input: QuizResultInput,
  deps: QuizResultDeps,
): Effect.Effect<void> {
  switch (input.source) {
    case "bolt":
      return processBoltEffect(input.question, deps);
    case "quiz":
      return processQuizEffect(input.results, deps);
    case "exam":
      return processExamEffect(input.parts, input.subject, input.paperId, deps);
    case "flashcard":
      return processFlashcardEffect(input.cards, input.qualities, input.subject, input.isSm2, deps);
  }
}

export async function processQuizResult(
  input: QuizResultInput,
  deps: QuizResultDeps,
): Promise<void> {
  return Effect.runPromise(processQuizResultEffect(input, deps));
}
