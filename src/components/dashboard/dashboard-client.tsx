"use client";

import dynamic from "next/dynamic";
import { GamificationCelebration } from "@/components/celebration";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { SearchWidget } from "@/components/dashboard/search/search-widget";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { PageSkeleton } from "@/components/ui/skeletons";
import { useGamification } from "@/hooks/use-gamification";
import { useDashboardQuiz } from "@/hooks/use-dashboard-quiz";
import { GamificationProvider } from "@/contexts/gamification-provider";

const QuizView = dynamic(() => import("@/components/quiz/quiz-view").then((m) => m.QuizView), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-dvh items-center justify-center">
      <PageSkeleton />
    </div>
  ),
});

export function DashboardClient() {
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

  return (
    <GamificationProvider>
      <AppErrorBoundary>
        <a
          href="#dashboard-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-skip-link focus:rounded-lg focus:bg-background focus:px-4 focus:py-2 focus:shadow-lg focus:outline-none"
        >
          Skip to content
        </a>
        <div className="flex h-full flex-col">
          {!isLoaded ? (
            <div className="flex min-h-dvh items-center justify-center px-4">
              <PageSkeleton />
            </div>
          ) : (
            <>
              <div className="px-4 pt-2 pb-4 sm:px-6">
                <SearchWidget />
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
