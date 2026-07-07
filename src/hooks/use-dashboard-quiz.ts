"use client";

import { useMemo, useState } from "react";
import type { QuizResults } from "@/components/quiz/quiz-view";
import { competencyService } from "@/lib/competency-engine";
import { flashcardEngine } from "@/lib/flashcard-engine";
import { dexieDataAccess } from "@/lib/db";
import { enqueue } from "@/lib/orchestrator/job-queue";
import { trackQuestionResult } from "@/lib/orchestrator/track-result";
import { processQuizResult, type QuizResultDeps } from "@/lib/services/quiz-result-processor";
import { logError } from "@/lib/shared/logger";
import { useTrackQuizEvents } from "@/hooks/use-analytics-tracking";
import { useViewTransition } from "@/hooks/use-view-transition";
import { useWrongAnswerJournal } from "@/hooks/use-wrong-answer-journal";
import { addStudySession, markPlanStale } from "@/lib/utils/study-planner";

interface UseDashboardQuizDeps {
  currentStreak: number;
  totalQuestionsAnswered: number;
  updateStreak: () => void;
  addXp: (amount: number, accuracy: number, streak: number, subject?: string) => void;
  checkAndUnlockAchievements: (
    questionsAnswered: number,
    accuracy: number,
    streak: number,
    currentLevel: number,
    perfectQuiz: boolean,
    extra?: {
      competentTopicsCount?: number;
      topicScoreImproved?: boolean;
      examScoreImproved?: boolean;
      leaderboardRank?: number;
      subjectLeaderboardRank?: number;
    },
  ) => void;
  checkForRewardChests: () => void;
  levelInfo: { level: number };
}

export function useDashboardQuiz(deps: UseDashboardQuizDeps) {
  const [quizActive, setQuizActive] = useState(false);
  const [quizSubject, setQuizSubject] = useState("");
  const { addWrongAnswer } = useWrongAnswerJournal();
  const { startViewTransition } = useViewTransition();
  const { trackQuizStart, trackQuizComplete } = useTrackQuizEvents();

  const quizResultDeps: QuizResultDeps = useMemo(
    () => ({
      updateStreak: deps.updateStreak,
      addXp: deps.addXp,
      checkAndUnlockAchievements: deps.checkAndUnlockAchievements,
      checkForRewardChests: deps.checkForRewardChests,
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
          .catch((err) => logError("DashboardClient.retention", err));
      },
      flashcardEngine,
      trackQuestionResult,
      enqueue,
      addStudySession,
      markPlanStale,
      currentStreak: deps.currentStreak,
      totalQuestionsAnswered: deps.totalQuestionsAnswered,
      levelInfo: deps.levelInfo,
    }),
    [
      deps.updateStreak,
      deps.addXp,
      deps.checkAndUnlockAchievements,
      deps.checkForRewardChests,
      addWrongAnswer,
      deps.currentStreak,
      deps.totalQuestionsAnswered,
      deps.levelInfo,
    ],
  );

  const handleStartQuiz = (subject: string) => {
    trackQuizStart(subject, 10);
    startViewTransition(() => {
      setQuizSubject(subject);
      setQuizActive(true);
    });
  };

  const handleFinishQuiz = async (results: QuizResults) => {
    trackQuizComplete(
      results.questions[0]?.subject ?? quizSubject,
      results.correctAnswers,
      results.totalQuestions,
    );
    await processQuizResult({ source: "quiz", results }, quizResultDeps);

    try {
      const competentTopicsCount = await competencyService.getCompetentTopicsCount();
      if (competentTopicsCount >= 5) {
        deps.checkAndUnlockAchievements(
          deps.totalQuestionsAnswered + results.totalQuestions,
          Math.round((results.correctAnswers / results.totalQuestions) * 100),
          deps.currentStreak,
          deps.levelInfo.level,
          results.correctAnswers === results.totalQuestions,
          { competentTopicsCount },
        );
      }
    } catch (err) {
      logError("DashboardClient.competencyCheck", err);
    }

    setQuizActive(false);
    setQuizSubject("");
  };

  const handleQuitQuiz = () => {
    setQuizActive(false);
    setQuizSubject("");
  };

  return { quizActive, quizSubject, handleStartQuiz, handleFinishQuiz, handleQuitQuiz };
}
