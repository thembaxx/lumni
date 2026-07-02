import { Effect } from "effect";
import type { QuestionType } from "@/lib/question-engine/types";
import { flashcardCreateEffect, getCorrectAnswerText } from "./effects";
import type { QuizResultDeps, ExamPartResult } from "./types";

export function processExamEffect(
  parts: ExamPartResult[],
  subject: string,
  paperId: string | undefined,
  deps: QuizResultDeps,
): Effect.Effect<void> {
  return Effect.gen(function* () {
    const correctCount = parts.filter((r) => r.correct).length;
    const totalCount = parts.length;
    const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
    deps.updateStreak();
    deps.addXp(totalCount, accuracy, deps.currentStreak);
    deps.checkAndUnlockAchievements(
      deps.totalQuestionsAnswered + totalCount,
      accuracy,
      deps.currentStreak,
      deps.levelInfo.level,
      accuracy === 100,
    );
    deps.checkForRewardChests();
    const flashcardEffects: Effect.Effect<void>[] = [];
    for (const result of parts) {
      const topic = result.sectionId;
      const maxScore = typeof result.part.marks === "number" ? result.part.marks : result.score;
      deps.trackQuestionResult({
        subjectId: subject,
        topicId: topic,
        bloomLevel: "apply",
        score: result.score,
        maxScore,
        paperId,
      });
      if (!result.correct) {
        const partText = result.part.text ?? `Question ${result.questionId}`;
        const correctAnswer = result.correctAnswerText ?? getCorrectAnswerText(result.part);
        deps.addWrongAnswer({
          questionId: result.partId,
          questionText: partText,
          subject,
          topic,
          correctAnswer,
          userAnswer: result.userAnswer ?? "",
          explanation: "",
        });
        deps.addRetentionItem?.({
          questionId: result.partId,
          questionText: partText,
          subject,
          topic,
          correctAnswer,
          explanation: "",
        });
        flashcardEffects.push(
          flashcardCreateEffect(
            deps,
            partText,
            getCorrectAnswerText(result.part) || "Review this topic",
            subject,
          ),
        );
      }
    }
    yield* Effect.all(flashcardEffects, { concurrency: "unbounded" });
    deps.markPlanStale();
    const weakCount = parts.filter((r) => !r.correct).length;
    if (weakCount > 0) {
      deps.addStudySession({
        subject,
        type: "exam",
        scheduledAt: Date.now() + 24 * 60 * 60 * 1000,
        duration: Math.min(weakCount * 5, 45),
        completed: false,
      });
    }
    deps.enqueue("analytics-sync", {
      events: parts.map((r) => ({
        event: "grade",
        timestamp: Date.now(),
        subject,
        questionType: "multiple-choice" as QuestionType,
        success: r.correct,
        duration: 0,
      })),
    });
  });
}
