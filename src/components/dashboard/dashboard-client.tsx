"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { GamificationCelebration } from "@/components/celebration";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { TabNav } from "@/components/dashboard/navigation/tab-nav";
import { ScrollAmbient } from "@/components/dashboard/scroll-ambient";
import { SearchWidget } from "@/components/dashboard/search/search-widget";
import type { TabValue } from "@/components/dashboard/types";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { Skeleton } from "@/components/ui/skeleton";
import { useGamification } from "@/hooks/use-gamification";
import { useDashboardQuiz } from "@/hooks/use-dashboard-quiz";
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

  const { quizActive, quizSubject, handleStartQuiz, handleFinishQuiz, handleQuitQuiz } =
    useDashboardQuiz({
      currentStreak,
      totalQuestionsAnswered,
      updateStreak,
      addXp,
      checkAndUnlockAchievements,
      checkForRewardChests,
      levelInfo,
    });

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
              <div className="px-4 pt-2 pb-4 sm:px-6">
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
