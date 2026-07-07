"use client";

import Lightning from "@hugeicons/core-free-icons/FlashIcon";
import SparklesIcon from "@hugeicons/core-free-icons/SparklesIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { AnonymousUpsell } from "@/components/dashboard/anonymous-upsell";
import { CompetitionCard } from "@/components/dashboard/competition-card";
import { DailyChallengeCard } from "@/components/dashboard/daily-challenge-card";
import { LearningMapCard } from "@/components/dashboard/learning-map-card";
import { NextBestActionCard } from "@/components/dashboard/next-best-action";
import { PersonalizedFeed } from "@/components/dashboard/personalized-feed";
import { QuestionOfTheDayCard } from "@/components/dashboard/question-of-the-day-card";
import { getFeed } from "@/lib/retention-loop/next-action";
import { QuickActions } from "@/components/dashboard/quick-actions/quick-actions";
import { StreakCard } from "@/components/dashboard/streak-card";
import { TodayFocusCard } from "@/components/dashboard/today-focus-card";
import { WeakTopicsCard } from "@/components/dashboard/weak-topics-card";
import { WordOfDayCard } from "@/components/dashboard/word-of-day";
import { PronunciationChartCard } from "@/components/dashboard/pronunciation-chart-card";
import { RewardChestPanel } from "@/components/gamification/reward-chest/reward-chest-panel";
import { UpcomingExamCard } from "@/components/dashboard/upcoming-exam-card";
import { GettingStartedCard } from "@/components/onboarding/getting-started-card";
import { NotificationNudge } from "@/components/onboarding/notification-nudge";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import {
  CollapsibleSection,
  CollapsibleSectionAlwaysOpen,
} from "@/components/shared/collapsible-section";
import { StaggerList } from "@/components/shared/stagger-list";
import { StaggeredSection, StaggerProvider } from "@/components/shared/stagger-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { useGamificationContext } from "@/contexts/gamification-provider";
import { useAuth } from "@/lib/auth/auth-context";
import { useFeatureFlag } from "@/hooks/use-feature-flag";

const FocusTimerCard = dynamic(
  () => import("@/components/dashboard/focus-timer-card").then((m) => m.FocusTimerCard),
  { ssr: false, loading: () => <Skeleton className="h-20 rounded-card" /> },
);

const StoriesProgressCard = dynamic(
  () => import("@/components/dashboard/stories-progress-card").then((m) => m.StoriesProgressCard),
  { ssr: false, loading: () => <Skeleton className="h-32 rounded-card" /> },
);

const LessonLibraryCard = dynamic(
  () => import("@/components/dashboard/lesson-library-card").then((m) => m.LessonLibraryCard),
  { ssr: false, loading: () => <Skeleton className="h-32 rounded-card" /> },
);

const VocabularyListCard = dynamic(
  () => import("@/components/vocabulary/vocabulary-list-card").then((m) => m.VocabularyListCard),
  { ssr: false, loading: () => <Skeleton className="h-32 rounded-card" /> },
);

function FeedSection({ userId }: { userId: string }) {
  const { enabled: showPersonalizedFeed } = useFeatureFlag("personalized-feed", userId);

  const { data: recommendations } = useQuery({
    queryKey: ["personalized-feed", userId],
    queryFn: async ({ queryKey }) => getFeed(queryKey[1] as string),
    staleTime: 60_000,
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
    enabled: showPersonalizedFeed,
  });

  if (!showPersonalizedFeed || !recommendations || recommendations.length === 0) {
    return (
      <StaggeredSection>
        <AppErrorBoundary>
          <NextBestActionCard />
        </AppErrorBoundary>
      </StaggeredSection>
    );
  }

  return (
    <StaggeredSection>
      <AppErrorBoundary>
        <PersonalizedFeed recommendations={recommendations} />
      </AppErrorBoundary>
    </StaggeredSection>
  );
}

function GridCell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

interface TodayTabProps {
  boltStreak: number;
}

export function TodayTab({ boltStreak }: TodayTabProps) {
  const t = useTranslations();
  const { user, isAnonymous } = useAuth();
  const { gamification } = useGamificationContext();
  const isLoggedIn = !!user && !isAnonymous;

  const stats = {
    questionsAnswered: gamification.totalXp > 0 ? Math.floor(gamification.totalXp / 25) : 0,
  };

  const todayStr = new Date().toDateString();
  const boltDone = gamification.lastPracticeDate === todayStr;

  return (
    <StaggerProvider baseDelay={0.02}>
      <CollapsibleSectionAlwaysOpen>
        <div
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4"
          aria-label="Get started"
        >
          {isLoggedIn && (
            <GridCell className="sm:col-span-2 lg:col-span-3">
              <StaggeredSection>
                <DailyChallengeCard streak={boltStreak} />
              </StaggeredSection>
            </GridCell>
          )}
          {isLoggedIn && (
            <StaggeredSection>
              <UpcomingExamCard />
            </StaggeredSection>
          )}
          {isLoggedIn && boltDone && (
            <GridCell className="sm:col-span-2 lg:col-span-3">
              <StaggeredSection>
                <div className="flex items-center gap-3 rounded-card border border-success/20 bg-success/5 px-4 py-3 transition-colors duration-200">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-success/20">
                    <HugeiconsIcon icon={SparklesIcon} className="size-5 text-success" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-balance font-semibold text-sm text-success-foreground">
                      {t("dashboard.boltCompleteTitle")}
                    </span>
                    <span className="text-sm text-success-foreground/70">
                      {t("dashboard.boltCompleteDescription")}
                    </span>
                  </div>
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-warning/10">
                    <HugeiconsIcon icon={Lightning} className="size-4 text-warning" />
                  </div>
                </div>
              </StaggeredSection>
            </GridCell>
          )}
          {isLoggedIn && (
            <GridCell className="lg:col-span-2">
              <StaggeredSection>
                <FeedSection userId={user!.$id} />
              </StaggeredSection>
            </GridCell>
          )}
          {isLoggedIn && (
            <GridCell className="sm:col-span-2 lg:col-span-3">
              <StaggeredSection>
                <TodayFocusCard />
              </StaggeredSection>
            </GridCell>
          )}
          {isLoggedIn && (
            <StaggeredSection>
              <GettingStartedCard />
            </StaggeredSection>
          )}
          <StaggeredSection>
            <NotificationNudge />
          </StaggeredSection>
        </div>
      </CollapsibleSectionAlwaysOpen>

      {isLoggedIn && (
        <CollapsibleSection title="Your Progress" count={stats.questionsAnswered || undefined}>
          <div
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4"
            aria-label="Your progress"
          >
            <StaggeredSection>
              <StreakCard />
            </StaggeredSection>
          </div>
        </CollapsibleSection>
      )}

      <CollapsibleSection title="Study Tools" defaultOpen={true}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4" aria-label="Study tools">
          <GridCell className="sm:col-span-2">
            <StaggeredSection>
              <FocusTimerCard />
            </StaggeredSection>
          </GridCell>
          <StaggeredSection>
            <QuestionOfTheDayCard />
          </StaggeredSection>
          <StaggeredSection>
            <WordOfDayCard />
          </StaggeredSection>
          <GridCell className="sm:col-span-2">
            <StaggeredSection>
              <PronunciationChartCard />
            </StaggeredSection>
          </GridCell>
          <GridCell className="sm:col-span-2">
            <StaggeredSection>
              <StoriesProgressCard />
            </StaggeredSection>
          </GridCell>
          {isLoggedIn && (
            <GridCell className="sm:col-span-2">
              <StaggeredSection>
                <WeakTopicsCard />
              </StaggeredSection>
            </GridCell>
          )}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="More">
        <div
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4"
          aria-label="More resources"
        >
          {isLoggedIn && (
            <GridCell className="sm:col-span-2">
              <StaggeredSection>
                <LessonLibraryCard />
              </StaggeredSection>
            </GridCell>
          )}
          {isLoggedIn && (
            <StaggeredSection>
              <VocabularyListCard />
            </StaggeredSection>
          )}
          {isLoggedIn && (
            <GridCell className="lg:col-span-3">
              <StaggeredSection>
                <AppErrorBoundary>
                  <LearningMapCard />
                </AppErrorBoundary>
              </StaggeredSection>
            </GridCell>
          )}
          {isLoggedIn && (
            <StaggeredSection>
              <RewardChestPanel />
            </StaggeredSection>
          )}
          {isLoggedIn && (
            <StaggeredSection>
              <CompetitionCard />
            </StaggeredSection>
          )}
          <GridCell className="sm:col-span-2 lg:col-span-3">
            <StaggeredSection>
              <StaggerList>
                <QuickActions />
              </StaggerList>
            </StaggeredSection>
          </GridCell>
        </div>
      </CollapsibleSection>

      {isAnonymous && (
        <StaggeredSection>
          <AnonymousUpsell />
        </StaggeredSection>
      )}
    </StaggerProvider>
  );
}
