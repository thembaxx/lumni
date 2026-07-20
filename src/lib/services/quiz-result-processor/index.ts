import { logError } from "@/lib/shared/logger";
import { flashcardCreate, flashcardReview } from "./effects";
import { handleBolt, handleExam, handleFlashcard, handleQuiz } from "./handlers";
import type { HandlerResult, QuizResultDeps, QuizResultInput } from "./types";

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

function dispatchHandler(input: QuizResultInput): HandlerResult {
  switch (input.source) {
    case "bolt":
      return handleBolt(input.question);
    case "quiz":
      return handleQuiz(input.results);
    case "exam":
      return handleExam(input.parts, input.subject, input.paperId);
    case "flashcard":
      return handleFlashcard(input.cards, input.qualities, input.subject, input.isSm2);
  }
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
  }
}

export async function processQuizResult(
  input: QuizResultInput,
  deps: QuizResultDeps,
): Promise<void> {
  const result = dispatchHandler(input);

  deps.updateStreak();
  deps.addXp(result.totalCount, result.accuracy, deps.currentStreak);
  deps.checkAndUnlockAchievements(
    deps.totalQuestionsAnswered + result.totalCount,
    result.accuracy,
    deps.currentStreak,
    deps.levelInfo.level,
    result.perfectQuiz,
  );
  deps.checkForRewardChests();

  for (const item of result.trackItems) {
    deps.trackQuestionResult(item);
  }

  const flashcardPromises: Promise<void>[] = [];

  for (let i = 0; i < result.wrongItems.length; i++) {
    const wrong = result.wrongItems[i];
    const retention = result.retentionItems[i];
    const flashcard = result.flashcardItems[i];

    deps.addWrongAnswer(wrong);
    if (retention) {
      deps.addRetentionItem?.(retention);
    }
    if (flashcard) {
      flashcardPromises.push(
        flashcardCreate(
          deps.flashcardEngine,
          flashcard.front,
          flashcard.back,
          flashcard.subject,
          flashcard.topic,
        ),
      );
    }
  }

  for (const review of result.flashcardReviews) {
    flashcardPromises.push(flashcardReview(deps.flashcardEngine, review.id, review.quality));
  }

  await Promise.all(flashcardPromises);

  if (result.shouldMarkPlanStale) {
    deps.markPlanStale();
  }

  if (result.wrongCount > 0) {
    const subject = extractSubject(input) ?? "unknown";
    deps.addStudySession({
      subject,
      type: input.source === "exam" ? "exam" : "quiz",
      scheduledAt: Date.now() + 24 * 60 * 60 * 1000,
      duration: Math.min(result.wrongCount * 5, 45),
      completed: false,
    });
  }

  deps.enqueue("analytics-sync", {
    events: result.events,
  });
}
