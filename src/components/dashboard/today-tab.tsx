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
import { useGamification } from "@/hooks/use-gamification";
import { useAuth } from "@/lib/auth/auth-context";

const FocusTimerCard = dynamic(
  () => import("@/components/dashboard/focus-timer-card").then((m) => m.FocusTimerCard),
  { ssr: false, loading: () => <Skeleton className="h-20 rounded-4xl" /> },
);

const StoriesProgressCard = dynamic(
  () => import("@/components/dashboard/stories-progress-card").then((m) => m.StoriesProgressCard),
  { ssr: false, loading: () => <Skeleton className="h-32 rounded-4xl" /> },
);

const LessonLibraryCard = dynamic(
  () => import("@/components/dashboard/lesson-library-card").then((m) => m.LessonLibraryCard),
  { ssr: false, loading: () => <Skeleton className="h-32 rounded-4xl" /> },
);

const VocabularyListCard = dynamic(
  () => import("@/components/vocabulary/vocabulary-list-card").then((m) => m.VocabularyListCard),
  { ssr: false, loading: () => <Skeleton className="h-32 rounded-4xl" /> },
);

function FeedSection({ userId }: { userId: string }) {
  const { data: recommendations } = useQuery({
    queryKey: ["personalized-feed", userId],
    queryFn: async ({ queryKey }) => getFeed(queryKey[1] as string),
    staleTime: 60000,
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  });

  if (!recommendations || recommendations.length === 0) {
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

interface TodayTabProps {
  boltStreak: number;
}

export function TodayTab({ boltStreak }: TodayTabProps) {
  const t = useTranslations();
  const { user, isAnonymous } = useAuth();
  const { gamification } = useGamification();
  const isLoggedIn = !!user && !isAnonymous;

  const stats = {
    questionsAnswered: gamification.totalXp > 0 ? Math.floor(gamification.totalXp / 25) : 0,
  };

  const todayStr = new Date().toDateString();
  const boltDone = gamification.lastPracticeDate === todayStr;

  return (
    <StaggerProvider baseDelay={0.02}>
      {/* Priority — always visible */}
      <CollapsibleSectionAlwaysOpen>
        <section className="flex flex-col gap-3" aria-label="Get started">
          {isLoggedIn && (
            <StaggeredSection>
              <DailyChallengeCard streak={boltStreak} />
            </StaggeredSection>
          )}
          {isLoggedIn && (
            <StaggeredSection>
              <UpcomingExamCard />
            </StaggeredSection>
          )}
          {isLoggedIn && boltDone && (
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
          )}
          {isLoggedIn && (
            <StaggeredSection>
              <FeedSection userId={user!.$id} />
            </StaggeredSection>
          )}
          {isLoggedIn && (
            <StaggeredSection>
              <TodayFocusCard />
            </StaggeredSection>
          )}
          {isLoggedIn && (
            <StaggeredSection>
              <GettingStartedCard />
            </StaggeredSection>
          )}
          <StaggeredSection>
            <NotificationNudge />
          </StaggeredSection>
        </section>
      </CollapsibleSectionAlwaysOpen>

      {/* Stats */}
      {isLoggedIn && (
        <CollapsibleSection title="Your Progress" count={stats.questionsAnswered || undefined}>
          <section className="flex flex-col gap-4" aria-label="Your progress">
            <StaggeredSection>
              <StreakCard />
            </StaggeredSection>
          </section>
        </CollapsibleSection>
      )}

      {/* Study Tools */}
      <CollapsibleSection title="Study Tools" defaultOpen={true}>
        <section className="flex flex-col gap-3" aria-label="Study tools">
          <StaggeredSection>
            <FocusTimerCard />
          </StaggeredSection>
          <StaggeredSection>
            <QuestionOfTheDayCard />
          </StaggeredSection>
          <StaggeredSection>
            <WordOfDayCard />
          </StaggeredSection>
          <StaggeredSection>
            <PronunciationChartCard />
          </StaggeredSection>
          <StaggeredSection>
            <StoriesProgressCard />
          </StaggeredSection>
          {isLoggedIn && (
            <StaggeredSection>
              <WeakTopicsCard />
            </StaggeredSection>
          )}
        </section>
      </CollapsibleSection>

      {/* Learning & More */}
      <CollapsibleSection title="More">
        <section className="flex flex-col gap-3" aria-label="More resources">
          {isLoggedIn && (
            <StaggeredSection>
              <LessonLibraryCard />
            </StaggeredSection>
          )}
          {isLoggedIn && (
            <StaggeredSection>
              <VocabularyListCard />
            </StaggeredSection>
          )}
          {isLoggedIn && (
            <StaggeredSection>
              <AppErrorBoundary>
                <LearningMapCard />
              </AppErrorBoundary>
            </StaggeredSection>
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
          <StaggeredSection>
            <StaggerList>
              <QuickActions />
            </StaggerList>
          </StaggeredSection>
        </section>
      </CollapsibleSection>

      {isAnonymous && (
        <StaggeredSection>
          <AnonymousUpsell />
        </StaggeredSection>
      )}
    </StaggerProvider>
  );
}
