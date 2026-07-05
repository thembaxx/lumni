"use client";

import { useMemo } from "react";
import type { LevelInfo } from "@/types/gamification";
import { useWrongAnswerJournal } from "@/hooks/use-wrong-answer-journal";
import { flashcardEngine } from "@/lib/flashcard-engine";
import { dexieDataAccess } from "@/lib/db";
import { enqueue } from "@/lib/orchestrator/job-queue";
import { trackQuestionResult } from "@/lib/orchestrator/track-result";
import type { QuizResultDeps } from "@/lib/services/quiz-result-processor";
import { logError } from "@/lib/shared/logger";
import { addStudySession, markPlanStale } from "@/lib/utils/study-planner";

interface GamificationActions {
  addXp: (amount: number, accuracy: number, streak: number) => void;
  updateStreak: () => void;
  checkAndUnlockAchievements: (
    questionsAnswered: number,
    accuracy: number,
    streak: number,
    level: number,
    perfectQuiz: boolean,
    extra?: {
      competentTopicsCount?: number;
      topicScoreImproved?: boolean;
      examScoreImproved?: boolean;
    },
  ) => void;
  checkForRewardChests: () => void;
  currentStreak: number;
  totalQuestionsAnswered: number;
  levelInfo: LevelInfo;
}

export function useQuizResultDeps(gamification: GamificationActions): QuizResultDeps {
  const { addWrongAnswer } = useWrongAnswerJournal();
  const {
    updateStreak,
    addXp,
    checkAndUnlockAchievements,
    checkForRewardChests,
    currentStreak,
    totalQuestionsAnswered,
    levelInfo,
  } = gamification;

  return useMemo(
    () => ({
      updateStreak,
      addXp,
      checkAndUnlockAchievements,
      checkForRewardChests,
      addWrongAnswer,
      addRetentionItem: (entry) => {
        dexieDataAccess.retentionRecurrence
          .add({
            questionId: entry.questionId,
            subject: entry.subject,
            topic: entry.topic,
            questionText: entry.questionText,
            correctAnswer: entry.correctAnswer,
            explanation: entry.explanation,
            scheduledAt: Date.now() + 24 * 60 * 60 * 1000,
            completed: false,
          })
          .catch((err) => logError("ExamSessionClient.retention", err));
      },
      flashcardEngine,
      trackQuestionResult,
      enqueue,
      addStudySession,
      markPlanStale,
      currentStreak,
      totalQuestionsAnswered,
      levelInfo,
    }),
    [
      updateStreak,
      addXp,
      checkAndUnlockAchievements,
      checkForRewardChests,
      addWrongAnswer,
      currentStreak,
      totalQuestionsAnswered,
      levelInfo,
    ],
  );
}
