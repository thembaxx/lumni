import { Effect } from "effect";
import { formatCorrectAnswer } from "@/lib/question-engine/answer-formatter";
import { flashcardCreateEffect } from "./effects";
import type { QuizResultDeps, QuizResults } from "./types";

export function processQuizEffect(results: QuizResults, deps: QuizResultDeps): Effect.Effect<void> {
  return Effect.gen(function* () {
    const accuracy =
      results.totalQuestions > 0
        ? Math.round((results.correctAnswers / results.totalQuestions) * 100)
        : 0;
    deps.updateStreak();
    deps.addXp(results.totalQuestions, accuracy, deps.currentStreak);
    deps.checkAndUnlockAchievements(
      deps.totalQuestionsAnswered + results.totalQuestions,
      accuracy,
      deps.currentStreak,
      deps.levelInfo.level,
      accuracy === 100,
    );
    deps.checkForRewardChests();
    const flashcardEffects: Effect.Effect<void>[] = [];
    for (const [i, question] of results.questions.entries()) {
      const correct = results.correctness[i] ?? false;
      deps.trackQuestionResult({
        subjectId: question.subject,
        topicId: question.topic,
        bloomLevel: question.bloomTaxonomy,
        score: correct ? 1 : 0,
        maxScore: 1,
      });
      if (!correct) {
        const correctAnswer = formatCorrectAnswer(question);
        deps.addWrongAnswer({
          questionId: question.id,
          questionText: question.questionText,
          subject: question.subject,
          topic: question.topic,
          correctAnswer,
          userAnswer: "(see quiz history)",
          explanation: question.explanation,
        });
        deps.addRetentionItem?.({
          questionId: question.id,
          questionText: question.questionText,
          subject: question.subject,
          topic: question.topic,
          correctAnswer,
          explanation: question.explanation,
        });
        flashcardEffects.push(
          flashcardCreateEffect(
            deps,
            question.questionText,
            correctAnswer,
            question.subject,
            question.topic,
          ),
        );
      }
    }
    yield* Effect.all(flashcardEffects, { concurrency: "unbounded" });
    deps.markPlanStale();
    const weakCount = results.questions.filter((_, i) => !results.correctness[i]).length;
    if (weakCount > 0) {
      const subject = results.questions[0]?.subject ?? "unknown";
      deps.addStudySession({
        subject,
        type: "quiz",
        scheduledAt: Date.now() + 24 * 60 * 60 * 1000,
        duration: Math.min(weakCount * 5, 45),
        completed: false,
      });
    }
    deps.enqueue("analytics-sync", {
      events: results.questions.map((q, i) => ({
        event: "grade",
        timestamp: Date.now(),
        subject: q.subject,
        questionType: q.type,
        success: results.correctness[i] ?? false,
        duration: 0,
      })),
    });
  });
}
