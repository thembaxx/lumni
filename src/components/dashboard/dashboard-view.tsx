"use client";

import Calendar01Icon from "@hugeicons/core-free-icons/Calendar01Icon";
import ChartUpIcon from "@hugeicons/core-free-icons/ChartUpIcon";
import BookOpen01Icon from "@hugeicons/core-free-icons/BookOpen01Icon";
import SettingsFutureIcon from "@hugeicons/core-free-icons/SettingsFutureIcon";
import SparklesIcon from "@hugeicons/core-free-icons/SparklesIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { AnonymousUpsell } from "@/components/dashboard/anonymous-upsell";
import { DailyChallengeCard } from "@/components/dashboard/daily-challenge-card";
import { HeroBanner } from "@/components/dashboard/dashboard-hero";
import { LearningMapCard } from "@/components/dashboard/learning-map-card";
import { NextBestActionCard } from "@/components/dashboard/next-best-action";
import { PersonalizedFeed } from "@/components/dashboard/personalized-feed";
import { CompetitionCard } from "@/components/dashboard/competition-card";
import { QuestionOfTheDayCard } from "@/components/dashboard/question-of-the-day-card";
import { QuickActions } from "@/components/dashboard/quick-actions/quick-actions";
import { QuizStartCard } from "@/components/dashboard/quiz-start-card";
import { RecentQuestionsCard } from "@/components/dashboard/recent-questions-card";
import { StreakCard } from "@/components/dashboard/streak-card";
import { StudyCard } from "@/components/dashboard/study-card";
import { StudyPlanOverview } from "@/components/dashboard/study-plan-overview";
import { TodayFocusCard } from "@/components/dashboard/today-focus-card";
import { UpcomingExamCard } from "@/components/dashboard/upcoming-exam-card";
import { WeakTopicsCard } from "@/components/dashboard/weak-topics-card";
import { WordOfDayCard } from "@/components/dashboard/word-of-day";
import { RewardChestPanel } from "@/components/gamification/reward-chest/reward-chest-panel";
import { GettingStartedCard } from "@/components/onboarding/getting-started-card";
import { NotificationNudge } from "@/components/onboarding/notification-nudge";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { StaggerList } from "@/components/shared/stagger-list";
import { StaggeredSection, StaggerProvider } from "@/components/shared/stagger-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/auth-context";
import { useFeatureFlag } from "@/hooks/use-feature-flag";
import { getFeed } from "@/lib/retention-loop/next-action";

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

const ComparativeAnalyticsPanel = dynamic(
  () =>
    import("@/components/dashboard/analytics/comparative-analytics-panel").then(
      (mod) => mod.ComparativeAnalyticsPanel,
    ),
  {
    ssr: false,
    loading: () => <Skeleton className="h-64 rounded-card" />,
  },
);

const StatsRow = dynamic(() => import("@/components/dashboard/stats-row").then((m) => m.StatsRow), {
  ssr: false,
  loading: () => <Skeleton className="h-32 rounded-card" />,
});

const LeaderboardCard = dynamic(
  () => import("@/components/social/leaderboard-card").then((m) => m.LeaderboardCard),
  { ssr: false, loading: () => <Skeleton className="h-48 rounded-card" /> },
);

const AchievementShowcase = dynamic(
  () => import("@/components/dashboard/achievement-showcase").then((m) => m.AchievementShowcase),
  { ssr: false, loading: () => <Skeleton className="h-32 rounded-card" /> },
);

const MasteryHeatmap = dynamic(
  () => import("@/components/dashboard/mastery-heatmap").then((m) => m.MasteryHeatmap),
  { ssr: false, loading: () => <Skeleton className="h-48 rounded-card" /> },
);

const PronunciationChartCard = dynamic(
  () =>
    import("@/components/dashboard/pronunciation-chart-card").then((m) => m.PronunciationChartCard),
  { ssr: false, loading: () => <Skeleton className="h-48 rounded-card" /> },
);

const MyAssignments = dynamic(
  () => import("@/components/dashboard/my-assignments").then((m) => m.MyAssignments),
  { ssr: false, loading: () => <Skeleton className="h-48 rounded-card" /> },
);

const OfflinePackManager = dynamic(
  () => import("@/components/dashboard/offline-packs").then((m) => m.OfflinePackManager),
  { ssr: false, loading: () => <Skeleton className="h-56 rounded-card" /> },
);

const CompetencyOverview = dynamic(
  () => import("@/components/dashboard/competency-overview").then((m) => m.CompetencyOverview),
  { ssr: false, loading: () => <Skeleton className="h-48 rounded-card" /> },
);

const BloomTaxonomyWidget = dynamic(
  () => import("@/components/dashboard/bloom-taxonomy-widget").then((m) => m.BloomTaxonomyWidget),
  { ssr: false, loading: () => <Skeleton className="h-48 rounded-card" /> },
);

function SectionHeading({
  icon,
  label,
  description,
}: {
  icon: typeof SparklesIcon;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-8 items-center justify-center rounded-xl bg-system-accent/10">
        <HugeiconsIcon icon={icon} size={16} className="text-system-accent" />
      </div>
      <div>
        <h2 className="font-extrabold text-(--fs-heading-3) text-foreground tracking-tight">
          {label}
        </h2>
        {description && <p className="text-muted-foreground text-xs">{description}</p>}
      </div>
    </div>
  );
}

function GridCell({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

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

interface DashboardViewProps {
  boltStreak: number;
  onStartQuiz: (subject: string) => void;
}

export function DashboardView({ boltStreak, onStartQuiz }: DashboardViewProps) {
  const { user, isAnonymous } = useAuth();
  const isLoggedIn = !!user && !isAnonymous;

  return (
    <StaggerProvider baseDelay={0.02}>
      <div className="flex flex-col gap-6 sm:gap-7 lg:gap-8">
        <StaggeredSection>
          <HeroBanner />
        </StaggeredSection>

        {isLoggedIn && (
          <>
            <section aria-label="Today">
              <div className="mb-4">
                <SectionHeading
                  icon={SparklesIcon}
                  label="Today"
                  description="Your daily challenge and focus"
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
                <GridCell className="sm:col-span-2 lg:col-span-3">
                  <StaggeredSection>
                    <DailyChallengeCard streak={boltStreak} />
                  </StaggeredSection>
                </GridCell>
                {isLoggedIn && (
                  <GridCell className="lg:col-span-2">
                    <StaggeredSection>
                      <FeedSection userId={user!.$id} />
                    </StaggeredSection>
                  </GridCell>
                )}
                <StaggeredSection>
                  <UpcomingExamCard />
                </StaggeredSection>
                <GridCell className="sm:col-span-2 lg:col-span-3">
                  <StaggeredSection>
                    <TodayFocusCard />
                  </StaggeredSection>
                </GridCell>
                {isLoggedIn && (
                  <StaggeredSection>
                    <GettingStartedCard />
                  </StaggeredSection>
                )}
                <StaggeredSection>
                  <NotificationNudge />
                </StaggeredSection>
              </div>
            </section>

            <section aria-label="Quick Actions">
              <StaggeredSection>
                <StaggerList>
                  <QuickActions />
                </StaggerList>
              </StaggeredSection>
            </section>

            <section aria-label="Your Plan">
              <div className="mb-4">
                <SectionHeading
                  icon={Calendar01Icon}
                  label="Your Plan"
                  description="Study plan and weak spots"
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
                <GridCell className="sm:col-span-2 lg:col-span-3">
                  <StaggeredSection>
                    <StudyPlanOverview />
                  </StaggeredSection>
                </GridCell>
                <GridCell className="lg:col-span-2">
                  <StaggeredSection>
                    <WeakTopicsCard />
                  </StaggeredSection>
                </GridCell>
                <StaggeredSection>
                  <StudyCard />
                </StaggeredSection>
                <GridCell className="sm:col-span-2 lg:col-span-3">
                  <StaggeredSection>
                    <MyAssignments />
                  </StaggeredSection>
                </GridCell>
                <GridCell className="lg:col-span-2">
                  <StaggeredSection>
                    <CompetencyOverview />
                  </StaggeredSection>
                </GridCell>
                <StaggeredSection>
                  <BloomTaxonomyWidget />
                </StaggeredSection>
              </div>
            </section>

            <section aria-label="Keep Learning">
              <div className="mb-4">
                <SectionHeading
                  icon={BookOpen01Icon}
                  label="Keep Learning"
                  description="Lessons, questions, and resources"
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
                <StaggeredSection>
                  <QuestionOfTheDayCard />
                </StaggeredSection>
                <GridCell className="lg:col-span-2">
                  <StaggeredSection>
                    <RecentQuestionsCard />
                  </StaggeredSection>
                </GridCell>
                <GridCell className="sm:col-span-2">
                  <StaggeredSection>
                    <LessonLibraryCard />
                  </StaggeredSection>
                </GridCell>
                <StaggeredSection>
                  <VocabularyListCard />
                </StaggeredSection>
                <GridCell className="sm:col-span-2 lg:col-span-3">
                  <StaggeredSection>
                    <AppErrorBoundary>
                      <LearningMapCard />
                    </AppErrorBoundary>
                  </StaggeredSection>
                </GridCell>
              </div>
            </section>

            <section aria-label="Your Progress">
              <div className="mb-4">
                <SectionHeading
                  icon={ChartUpIcon}
                  label="Your Progress"
                  description="Stats, achievements, and leaderboard"
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
                <GridCell className="sm:col-span-2 lg:col-span-3">
                  <StaggeredSection>
                    <StatsRow />
                  </StaggeredSection>
                </GridCell>
                <GridCell className="sm:col-span-2 lg:col-span-3">
                  <StaggeredSection>
                    <ComparativeAnalyticsPanel />
                  </StaggeredSection>
                </GridCell>
                <StaggeredSection>
                  <StreakCard />
                </StaggeredSection>
                <GridCell className="lg:col-span-2">
                  <StaggeredSection>
                    <LeaderboardCard />
                  </StaggeredSection>
                </GridCell>
                <StaggeredSection>
                  <AchievementShowcase />
                </StaggeredSection>
                <StaggeredSection>
                  <RewardChestPanel />
                </StaggeredSection>
                <StaggeredSection>
                  <CompetitionCard />
                </StaggeredSection>
                <GridCell className="sm:col-span-2 lg:col-span-3">
                  <StaggeredSection>
                    <MasteryHeatmap />
                  </StaggeredSection>
                </GridCell>
              </div>
            </section>

            <section aria-label="Tools">
              <div className="mb-4">
                <SectionHeading
                  icon={SettingsFutureIcon}
                  label="Tools"
                  description="Timer, offline packs, and more"
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
                <GridCell className="sm:col-span-2 lg:col-span-3">
                  <StaggeredSection>
                    <FocusTimerCard />
                  </StaggeredSection>
                </GridCell>
                <StaggeredSection>
                  <WordOfDayCard />
                </StaggeredSection>
                <StaggeredSection>
                  <StoriesProgressCard />
                </StaggeredSection>
                <GridCell className="sm:col-span-2 lg:col-span-3">
                  <StaggeredSection>
                    <PronunciationChartCard />
                  </StaggeredSection>
                </GridCell>
                <GridCell className="sm:col-span-2 lg:col-span-3">
                  <StaggeredSection>
                    <OfflinePackManager />
                  </StaggeredSection>
                </GridCell>
                <GridCell className="sm:col-span-2 lg:col-span-3">
                  <StaggeredSection>
                    <QuizStartCard onStart={onStartQuiz} />
                  </StaggeredSection>
                </GridCell>
              </div>
            </section>
          </>
        )}

        {isAnonymous && (
          <StaggeredSection>
            <AnonymousUpsell />
          </StaggeredSection>
        )}
      </div>
    </StaggerProvider>
  );
}
