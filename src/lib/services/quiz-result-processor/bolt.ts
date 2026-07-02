import { Effect } from "effect";
import { formatCorrectAnswer } from "@/lib/question-engine/answer-formatter";
import { flashcardCreateEffect } from "./effects";
import type { QuizResultDeps, BoltResult } from "./types";

export function processBoltEffect(result: BoltResult, deps: QuizResultDeps): Effect.Effect<void> {
  return Effect.gen(function* () {
    const { question, correct } = result;
    const accuracy = correct ? 100 : 0;
    deps.updateStreak();
    deps.addXp(1, accuracy, deps.currentStreak);
    deps.checkAndUnlockAchievements(
      deps.totalQuestionsAnswered + 1,
      accuracy,
      deps.currentStreak,
      deps.levelInfo.level,
      correct,
    );
    deps.checkForRewardChests();
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
      yield* flashcardCreateEffect(
        deps,
        question.questionText,
        correctAnswer,
        question.subject,
        question.topic,
      );
    }
    deps.enqueue("analytics-sync", {
      events: [
        {
          event: "grade",
          timestamp: Date.now(),
          subject: question.subject,
          questionType: question.type,
          success: correct,
          duration: 0,
        },
      ],
    });
  });
}
