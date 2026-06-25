"use client";

import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import { GamificationCelebration } from "@/components/celebration";
import type { BoltResult } from "@/components/dashboard/daily-challenge-dialog";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { TabNav } from "@/components/dashboard/navigation/tab-nav";
import { ScrollAmbient } from "@/components/dashboard/scroll-ambient";
import { SearchWidget } from "@/components/dashboard/search/search-widget";
import type { TabValue } from "@/components/dashboard/types";
import type { QuizResults } from "@/components/quiz/quiz-view";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { Skeleton } from "@/components/ui/skeleton";
import { useTrackQuizEvents } from "@/hooks/use-analytics-tracking";
import { useGamification } from "@/hooks/use-gamification";
import { useViewTransition } from "@/hooks/use-view-transition";
import { useWrongAnswerJournal } from "@/hooks/use-wrong-answer-journal";
import { flashcardEngine } from "@/lib/flashcard-engine";
import { dexieDataAccess } from "@/lib/db";
import { enqueue } from "@/lib/orchestrator/job-queue";
import { trackQuestionResult } from "@/lib/orchestrator/track-result";
import { processQuizResult, type QuizResultDeps } from "@/lib/services/quiz-result-processor";
import { iOSEase } from "@/lib/utils/animation";
import { addStudySession, markPlanStale } from "@/lib/utils/study-planner";

const QuizView = dynamic(() => import("@/components/quiz/quiz-view").then((m) => m.QuizView), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-dvh items-center justify-center">
      <Skeleton className="size-full max-w-3xl rounded-3xl" />
    </div>
  ),
});

export function DashboardClient({ initialTab = "today" }: { initialTab?: string }) {
  const reduced = useReducedMotion();
  const [quizActive, setQuizActive] = useState(false);
  const [quizSubject, setQuizSubject] = useState("");
  const [activeTab, setActiveTab] = useState<TabValue>(initialTab as TabValue);
  const {
    isLoaded,
    addXp,
    updateStreak,
    checkAndUnlockAchievements,
    checkForRewardChests,
    currentStreak,
    levelInfo,
    totalQuestionsAnswered,
  } = useGamification();

  const { addWrongAnswer } = useWrongAnswerJournal();
  const { startViewTransition } = useViewTransition();
  const { trackQuizStart, trackQuizComplete } = useTrackQuizEvents();

  const handleStartQuiz = (subject: string) => {
    trackQuizStart(subject, 10);
    startViewTransition(() => {
      setQuizSubject(subject);
      setQuizActive(true);
    });
  };

  const quizResultDeps: QuizResultDeps = useMemo(
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
          .catch(() => {});
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

  const handleBoltComplete = useCallback(
    async (result: BoltResult) => {
      await processQuizResult({ source: "bolt", question: result }, quizResultDeps);
    },
    [quizResultDeps],
  );

  const handleFinishQuiz = async (results: QuizResults) => {
    trackQuizComplete(
      results.questions[0]?.subject ?? quizSubject,
      results.correctAnswers,
      results.totalQuestions,
    );
    await processQuizResult({ source: "quiz", results }, quizResultDeps);

    try {
      const records = await dexieDataAccess.competencies.toArray();
      const topicScores = new Map<string, number[]>();
      for (const r of records) {
        const key = `${r.subjectId}:${r.topicId}`;
        const scores = topicScores.get(key) ?? [];
        scores.push(r.score);
        topicScores.set(key, scores);
      }
      const competentTopicsCount = Array.from(topicScores.values()).filter(
        (scores) => scores.reduce((a, b) => a + b, 0) / scores.length >= 70,
      ).length;
      if (competentTopicsCount >= 5) {
        checkAndUnlockAchievements(
          totalQuestionsAnswered + results.totalQuestions,
          Math.round((results.correctAnswers / results.totalQuestions) * 100),
          currentStreak,
          levelInfo.level,
          results.correctAnswers === results.totalQuestions,
          { competentTopicsCount },
        );
      }
    } catch {
      // Competency check is non-critical
    }

    setQuizActive(false);
    setQuizSubject("");
  };

  const handleQuitQuiz = () => {
    setQuizActive(false);
    setQuizSubject("");
  };

  const handleTabChange = (tab: TabValue) => {
    setActiveTab(tab);
  };

  return (
    <AppErrorBoundary>
      <a
        href="#dashboard-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-skip-link focus:rounded-lg focus:bg-background focus:px-4 focus:py-2 focus:shadow-lg focus:outline-none"
      >
        Skip to content
      </a>
      <ScrollAmbient />
      <div className="flex h-full flex-col">
        {!isLoaded ? (
          <m.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            transition={{ duration: 0.2, ease: iOSEase }}
            className="flex min-h-dvh items-center justify-center px-4"
          >
            <div className="flex w-full max-w-md flex-col gap-3">
              <Skeleton className="h-24 rounded-3xl" />
              <div className="grid grid-cols-12 gap-3">
                <Skeleton className="col-span-8 h-24 rounded-3xl" />
                <Skeleton className="col-span-4 h-24 rounded-3xl" />
              </div>
              <Skeleton className="h-32 rounded-3xl" />
              <Skeleton className="h-20 rounded-3xl" />
            </div>
          </m.div>
        ) : (
          <>
            <div className="px-4 pt-2 pb-4">
              <SearchWidget />
              <TabNav activeTab={activeTab} onTabChange={handleTabChange} />
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              {reduced ? (
                quizActive ? (
                  <QuizView
                    initialSubject={quizSubject}
                    variant="full"
                    onQuit={handleQuitQuiz}
                    onFinish={handleFinishQuiz}
                  />
                ) : (
                  <DashboardContent
                    id="dashboard-content"
                    onStartQuiz={handleStartQuiz}
                    activeTab={activeTab}
                    onBoltComplete={handleBoltComplete}
                    boltStreak={currentStreak}
                  />
                )
              ) : (
                <AnimatePresence initial={false} mode="wait">
                  {quizActive ? (
                    <m.div
                      key="quiz"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.25, ease: iOSEase },
                      }}
                      exit={{
                        opacity: 0,
                        y: -8,
                        filter: "blur(2px)",
                        transition: { duration: 0.15, ease: iOSEase },
                      }}
                    >
                      <QuizView
                        initialSubject={quizSubject}
                        variant="full"
                        onQuit={handleQuitQuiz}
                        onFinish={handleFinishQuiz}
                      />
                    </m.div>
                  ) : (
                    <DashboardContent
                      id="dashboard-content"
                      onStartQuiz={handleStartQuiz}
                      activeTab={activeTab}
                      onBoltComplete={handleBoltComplete}
                      boltStreak={currentStreak}
                    />
                  )}
                </AnimatePresence>
              )}
            </div>
          </>
        )}
      </div>
      <GamificationCelebration />
    </AppErrorBoundary>
  );
}
