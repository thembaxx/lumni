"use client";

import dynamic from "next/dynamic";
import { AnonymousUpsell } from "@/components/dashboard/anonymous-upsell";
import { DailyChallengeCard } from "@/components/dashboard/daily-challenge-card";
import { HeroBanner } from "@/components/dashboard/dashboard-hero";
import { LearningMapCard } from "@/components/dashboard/learning-map-card";
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
import { RewardChestPanel } from "@/components/gamification/reward-chest/reward-chest-panel";
import { GettingStartedCard } from "@/components/onboarding/getting-started-card";
import { NotificationNudge } from "@/components/onboarding/notification-nudge";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { StaggeredSection, StaggerProvider } from "@/components/shared/stagger-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/auth-context";
import { BentoGrid, BentoCell } from "./parts/bento-grid";
import { FeedSection } from "./feed-section";

const FocusTimerCard = dynamic(
  () => import("@/components/dashboard/focus-timer-card").then((m) => m.FocusTimerCard),
  { ssr: false, loading: () => <Skeleton className="h-20 rounded-card" /> },
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

const AchievementShowcase = dynamic(
  () => import("@/components/dashboard/achievement-showcase").then((m) => m.AchievementShowcase),
  { ssr: false, loading: () => <Skeleton className="h-20 rounded-card" /> },
);

const MasteryHeatmap = dynamic(
  () => import("@/components/dashboard/mastery-heatmap").then((m) => m.MasteryHeatmap),
  { ssr: false, loading: () => <Skeleton className="h-48 rounded-card" /> },
);

const WordOfDayCard = dynamic(
  () => import("@/components/dashboard/word-of-day").then((m) => m.WordOfDayCard),
  { ssr: false, loading: () => <Skeleton className="h-24 rounded-card" /> },
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

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="mb-2 flex items-center gap-2 sm:mb-3">
      <div className="h-1.5 w-1.5 rounded-full bg-system-accent" aria-hidden="true" />
      <h2 className="font-semibold text-(--fs-caption-1) text-muted-foreground uppercase tracking-widest">
        {label}
      </h2>
    </div>
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
      <div className="flex flex-col gap-8 sm:gap-10 lg:gap-12">
        {/* ZONE 1: TODAY */}
        <section aria-label="Today" className="animate-section-reveal">
          <HeroBanner />
          {isLoggedIn && (
            <div className="mt-3 sm:mt-4">
              <BentoGrid>
                <BentoCell span="full">
                  <DailyChallengeCard streak={boltStreak} />
                </BentoCell>
              </BentoGrid>
            </div>
          )}
        </section>

        {isLoggedIn && (
          <>
            {/* ZONE 2: FOCUS */}
            <section aria-label="Focus" className="animate-section-reveal">
              <SectionLabel label="Focus" />
              <BentoGrid>
                <BentoCell span="full">
                  <StaggeredSection>
                    <FeedSection userId={user!.$id} />
                  </StaggeredSection>
                </BentoCell>
                <BentoCell span="2col">
                  <StaggeredSection>
                    <TodayFocusCard />
                  </StaggeredSection>
                </BentoCell>
                <StaggeredSection>
                  <UpcomingExamCard />
                </StaggeredSection>
                <StaggeredSection>
                  <GettingStartedCard />
                </StaggeredSection>
                <StaggeredSection>
                  <NotificationNudge />
                </StaggeredSection>
              </BentoGrid>

              <div className="mt-3 sm:mt-4">
                <QuickActions />
              </div>
            </section>

            {/* ZONE 3: PLAN + PROGRESS */}
            <section aria-label="Plan and Progress" className="animate-section-reveal">
              <SectionLabel label="Your Plan" />
              <BentoGrid>
                <BentoCell span="full">
                  <StaggeredSection>
                    <StudyPlanOverview />
                  </StaggeredSection>
                </BentoCell>
                <BentoCell span="2col">
                  <StaggeredSection>
                    <WeakTopicsCard />
                  </StaggeredSection>
                </BentoCell>
                <StaggeredSection>
                  <StudyCard />
                </StaggeredSection>
              </BentoGrid>

              <div className="mt-4 sm:mt-5">
                <SectionLabel label="Progress" />
                <BentoGrid>
                  <BentoCell span="2col">
                    <StaggeredSection>
                      <CompetencyOverview />
                    </StaggeredSection>
                  </BentoCell>
                  <StaggeredSection>
                    <StreakCard />
                  </StaggeredSection>
                  <BentoCell span="full">
                    <StaggeredSection>
                      <AchievementShowcase />
                    </StaggeredSection>
                  </BentoCell>
                  <BentoCell span="full">
                    <StaggeredSection>
                      <AppErrorBoundary>
                        <CompetitionCard />
                      </AppErrorBoundary>
                    </StaggeredSection>
                  </BentoCell>
                  <BentoCell span="full">
                    <StaggeredSection>
                      <ComparativeAnalyticsPanel />
                    </StaggeredSection>
                  </BentoCell>
                  <BentoCell span="full">
                    <StaggeredSection>
                      <RewardChestPanel />
                    </StaggeredSection>
                  </BentoCell>
                  <BentoCell span="full">
                    <StaggeredSection>
                      <MyAssignments />
                    </StaggeredSection>
                  </BentoCell>
                  <BentoCell span="full">
                    <StaggeredSection>
                      <MasteryHeatmap />
                    </StaggeredSection>
                  </BentoCell>
                </BentoGrid>
              </div>
            </section>

            {/* ZONE 4: EXPLORE */}
            <section aria-label="Explore" className="animate-section-reveal">
              <SectionLabel label="Explore" />
              <BentoGrid>
                <StaggeredSection>
                  <QuestionOfTheDayCard />
                </StaggeredSection>
                <BentoCell span="2col">
                  <StaggeredSection>
                    <RecentQuestionsCard />
                  </StaggeredSection>
                </BentoCell>
                <BentoCell span="full">
                  <StaggeredSection>
                    <AppErrorBoundary>
                      <LearningMapCard />
                    </AppErrorBoundary>
                  </StaggeredSection>
                </BentoCell>
                <StaggeredSection>
                  <WordOfDayCard />
                </StaggeredSection>
                <StaggeredSection>
                  <FocusTimerCard />
                </StaggeredSection>
                <BentoCell span="full">
                  <StaggeredSection>
                    <OfflinePackManager />
                  </StaggeredSection>
                </BentoCell>
                <BentoCell span="full">
                  <StaggeredSection>
                    <QuizStartCard onStart={onStartQuiz} />
                  </StaggeredSection>
                </BentoCell>
              </BentoGrid>
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
