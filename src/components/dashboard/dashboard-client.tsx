"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { GamificationCelebration } from "@/components/celebration";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { TabNav } from "@/components/dashboard/navigation/tab-nav";
import { ScrollAmbient } from "@/components/dashboard/scroll-ambient";
import { SearchWidget } from "@/components/dashboard/search/search-widget";
import type { TabValue } from "@/components/dashboard/types";
import { logError } from "@/lib/shared/logger";
import type { QuizResults } from "@/components/quiz/quiz-view";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { Skeleton } from "@/components/ui/skeleton";
import { useTrackQuizEvents } from "@/hooks/use-analytics-tracking";
import { useGamification } from "@/hooks/use-gamification";
import { useViewTransition } from "@/hooks/use-view-transition";
import { useWrongAnswerJournal } from "@/hooks/use-wrong-answer-journal";
import { competencyService } from "@/lib/competency-engine";
import { flashcardEngine } from "@/lib/flashcard-engine";
import { dexieDataAccess } from "@/lib/db";
import { enqueue } from "@/lib/orchestrator/job-queue";
import { trackQuestionResult } from "@/lib/orchestrator/track-result";
import { processQuizResult, type QuizResultDeps } from "@/lib/services/quiz-result-processor";
import { addStudySession, markPlanStale } from "@/lib/utils/study-planner";
import { GamificationProvider } from "@/contexts/gamification-provider";

const QuizView = dynamic(() => import("@/components/quiz/quiz-view").then((m) => m.QuizView), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-dvh items-center justify-center">
      <Skeleton className="size-full max-w-3xl rounded-3xl" />
    </div>
  ),
});

export function DashboardClient({ initialTab = "today" }: { initialTab?: string }) {
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
          .catch((err) => logError("DashboardClient.retention", err));
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
        checkAndUnlockAchievements(
          totalQuestionsAnswered + results.totalQuestions,
          Math.round((results.correctAnswers / results.totalQuestions) * 100),
          currentStreak,
          levelInfo.level,
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

  const handleTabChange = (tab: TabValue) => {
    setActiveTab(tab);
  };

  return (
    <GamificationProvider>
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
            <div className="flex min-h-dvh items-center justify-center px-4">
              <div className="flex w-full max-w-md flex-col gap-3">
                <Skeleton className="h-24 rounded-3xl" />
                <div className="grid grid-cols-12 gap-3">
                  <Skeleton className="col-span-8 h-24 rounded-3xl" />
                  <Skeleton className="col-span-4 h-24 rounded-3xl" />
                </div>
                <Skeleton className="h-32 rounded-3xl" />
                <Skeleton className="h-20 rounded-3xl" />
              </div>
            </div>
          ) : (
            <>
              <div className="px-4 pt-2 pb-4">
                <SearchWidget />
                <TabNav activeTab={activeTab} onTabChange={handleTabChange} />
              </div>

              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                {quizActive ? (
                  <div className="card-entrance">
                    <QuizView
                      initialSubject={quizSubject}
                      variant="full"
                      onQuit={handleQuitQuiz}
                      onFinish={handleFinishQuiz}
                    />
                  </div>
                ) : (
                  <DashboardContent
                    id="dashboard-content"
                    onStartQuiz={handleStartQuiz}
                    activeTab={activeTab}
                    boltStreak={currentStreak}
                  />
                )}
              </div>
            </>
          )}
        </div>
        <GamificationCelebration />
      </AppErrorBoundary>
    </GamificationProvider>
  );
}
