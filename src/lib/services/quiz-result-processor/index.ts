import { Effect } from "effect";
import { processBoltEffect } from "./bolt";
import { processQuizEffect } from "./quiz";
import { processExamEffect } from "./exam";
import { processFlashcardEffect } from "./flashcard";
import type { QuizResultInput, QuizResultDeps } from "./types";
import type { WebhookDispatcher } from "@/lib/webhooks";
import { logError } from "@/lib/shared/logger";

let _dispatcher: WebhookDispatcher | null = null;

async function getDispatcher(): Promise<WebhookDispatcher | null> {
  if (_dispatcher) return _dispatcher;
  try {
    const { createDispatcher } = await import("@/lib/webhooks");
    const { createRegistry } = await import("@/lib/webhooks");
    const { dexieDataAccess } = await import("@/lib/db");
    const registry = createRegistry(dexieDataAccess);
    _dispatcher = createDispatcher({ db: dexieDataAccess, registry });
    return _dispatcher;
  } catch {
    return null;
  }
}

function assertUnreachable(source: string, context: string): never {
  throw new Error(`Unhandled source "${source}" in ${context}`);
}

function extractSubject(input: QuizResultInput): string | undefined {
  switch (input.source) {
    case "bolt":
      return input.question.question.subject;
    case "quiz":
      return input.results.questions[0]?.subject;
    case "exam":
      return input.subject;
    case "flashcard":
      return input.subject;
    default:
      return assertUnreachable((input as QuizResultInput).source, "extractSubject");
  }
}

function extractScore(input: QuizResultInput): { score: number; total: number } | undefined {
  switch (input.source) {
    case "bolt":
      return { score: input.question.correct ? 1 : 0, total: 1 };
    case "quiz":
      return { score: input.results.correctAnswers, total: input.results.totalQuestions };
    case "exam": {
      const total = input.parts.length;
      const correct = input.parts.filter((p) => p.correct).length;
      return { score: correct, total };
    }
    case "flashcard":
      return undefined;
    default:
      return assertUnreachable((input as QuizResultInput).source, "extractScore");
  }
}

export type {
  QuizResultInput,
  QuizResultDeps,
  WrongAnswerInput,
  TrackResultInput,
  RetentionInput,
  FlashcardEngine,
  BoltResult,
  QuizResults,
  ExamPartResult,
  FlashcardItem,
} from "./types";

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
    default:
      return assertUnreachable((input as QuizResultInput).source, "processQuizResultEffect");
  }
}

export async function processQuizResult(
  input: QuizResultInput,
  deps: QuizResultDeps,
): Promise<void> {
  await Effect.runPromise(processQuizResultEffect(input, deps));

  const dispatcher = await getDispatcher();
  if (!dispatcher) return;

  const subject = extractSubject(input);
  const scoreInfo = extractScore(input);

  dispatcher
    .dispatchWebhook("quiz.completed", {
      subject,
      score: scoreInfo?.score,
      totalQuestions: scoreInfo?.total,
    })
    .catch((err) => logError("QuizResultProcessor.webhook", err));
}
