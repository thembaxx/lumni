"use client";

import BookOpen01Icon from "@hugeicons/core-free-icons/BookOpen01Icon";
import Calendar01Icon from "@hugeicons/core-free-icons/Calendar01Icon";
import ChartUpIcon from "@hugeicons/core-free-icons/ChartUpIcon";
import Settings02Icon from "@hugeicons/core-free-icons/Settings02Icon";
import SparklesIcon from "@hugeicons/core-free-icons/SparklesIcon";
import dynamic from "next/dynamic";
import { DailyChallengeCard } from "@/components/dashboard/daily-challenge-card";
import { HeroBanner } from "@/components/dashboard/dashboard-hero";
import { LessonLibraryCard } from "@/components/dashboard/lesson-library-card";
import { MyAssignments } from "@/components/dashboard/my-assignments";
import { NextBestActionCard } from "@/components/dashboard/next-best-action";
import { QuestionOfTheDayCard } from "@/components/dashboard/question-of-the-day-card";
import { QuizStartCard } from "@/components/dashboard/quiz-start-card";
import { QuickActions } from "@/components/dashboard/quick-actions/quick-actions";
import { RecentQuestionsCard } from "@/components/dashboard/recent-questions-card";
import { StatsRow } from "@/components/dashboard/stats-row";
import { StudyCard } from "@/components/dashboard/study-card";
import { StudyPlanOverview } from "@/components/dashboard/study-plan-overview";
import { TodayFocusCard } from "@/components/dashboard/today-focus-card";
import { UpcomingExamCard } from "@/components/dashboard/upcoming-exam-card";
import { VocabularyListCard } from "@/components/vocabulary/vocabulary-list-card";
import { WeakTopicsCard } from "@/components/dashboard/weak-topics-card";
import { WordOfDayCard } from "@/components/dashboard/word-of-day";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/auth-context";
import { AnonymousUpsell } from "@/components/dashboard/anonymous-upsell";
import { StaggeredSection, StaggerProvider } from "@/components/shared/stagger-provider";
import { BentoGrid, BentoCell } from "./parts/bento-grid";
import { SectionHeading } from "./parts/section-heading";

const AchievementShowcase = dynamic(
  () => import("@/components/dashboard/achievement-showcase").then((m) => m.AchievementShowcase),
  { loading: () => <Skeleton className="h-20 rounded-card" /> },
);

const CompetitionCard = dynamic(
  () => import("@/components/dashboard/competition-card").then((m) => m.CompetitionCard),
  { loading: () => <Skeleton className="h-20 rounded-card" /> },
);

const FocusTimerCard = dynamic(
  () => import("@/components/dashboard/focus-timer-card").then((m) => m.FocusTimerCard),
  { ssr: false, loading: () => <Skeleton className="h-20 rounded-card" /> },
);

const LearningMapCard = dynamic(
  () => import("@/components/dashboard/learning-map-card").then((m) => m.LearningMapCard),
  { loading: () => <Skeleton className="h-48 rounded-card" /> },
);

const OfflinePackManager = dynamic(
  () => import("@/components/dashboard/offline-packs").then((m) => m.OfflinePackManager),
  { loading: () => <Skeleton className="h-40 rounded-card" /> },
);

const PronunciationChartCard = dynamic(
  () =>
    import("@/components/dashboard/pronunciation-chart-card").then((m) => m.PronunciationChartCard),
  { loading: () => <Skeleton className="h-48 rounded-card" /> },
);

interface DashboardViewProps {
  boltStreak: number;
  onStartQuiz: (subject: string) => void;
}

export function DashboardView({ boltStreak, onStartQuiz }: DashboardViewProps) {
  const { isAnonymous } = useAuth();

  if (isAnonymous) {
    return (
      <StaggerProvider baseDelay={0.02}>
        <StaggeredSection>
          <AnonymousUpsell />
        </StaggeredSection>
      </StaggerProvider>
    );
  }

  return (
    <StaggerProvider baseDelay={0.02}>
      <div className="flex flex-col gap-8 sm:gap-10 lg:gap-12">
        {/* Zone 1: Hero Banner */}
        <section aria-label="Today" className="animate-section-reveal">
          <StaggeredSection>
            <HeroBanner />
          </StaggeredSection>
        </section>

        {/* Zone 2: Quick Actions — no section heading */}
        <section aria-label="Quick actions" className="animate-section-reveal">
          <StaggeredSection>
            <QuickActions />
          </StaggeredSection>
        </section>

        {/* Zone 3: Daily Pulse */}
        <section aria-label="Daily pulse" className="animate-section-reveal">
          <div className="mb-3 flex items-center gap-2 sm:mb-4">
            <SectionHeading icon={SparklesIcon} label="Today" />
          </div>
          <BentoGrid>
            <BentoCell span="full">
              <StaggeredSection>
                <DailyChallengeCard streak={boltStreak} />
              </StaggeredSection>
            </BentoCell>
            <BentoCell span="2col">
              <StaggeredSection>
                <NextBestActionCard />
              </StaggeredSection>
            </BentoCell>
            <BentoCell span="2col">
              <StaggeredSection>
                <TodayFocusCard />
              </StaggeredSection>
            </BentoCell>
            <BentoCell>
              <StaggeredSection>
                <UpcomingExamCard />
              </StaggeredSection>
            </BentoCell>
          </BentoGrid>
        </section>

        {/* Zone 4: Your Plan */}
        <section aria-label="Your plan" className="animate-section-reveal">
          <div className="mb-3 flex items-center gap-2 sm:mb-4">
            <SectionHeading icon={Calendar01Icon} label="Your Plan" />
          </div>
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
            <BentoCell>
              <StaggeredSection>
                <StudyCard />
              </StaggeredSection>
            </BentoCell>
            <BentoCell span="2col">
              <StaggeredSection>
                <MyAssignments />
              </StaggeredSection>
            </BentoCell>
          </BentoGrid>
        </section>

        {/* Zone 5: Keep Learning */}
        <section aria-label="Keep learning" className="animate-section-reveal">
          <div className="mb-3 flex items-center gap-2 sm:mb-4">
            <SectionHeading icon={BookOpen01Icon} label="Keep Learning" />
          </div>
          <BentoGrid>
            <BentoCell>
              <StaggeredSection>
                <QuestionOfTheDayCard />
              </StaggeredSection>
            </BentoCell>
            <BentoCell span="2col">
              <StaggeredSection>
                <RecentQuestionsCard />
              </StaggeredSection>
            </BentoCell>
            <BentoCell span="2col">
              <StaggeredSection>
                <LessonLibraryCard />
              </StaggeredSection>
            </BentoCell>
            <BentoCell>
              <StaggeredSection>
                <VocabularyListCard />
              </StaggeredSection>
            </BentoCell>
            <BentoCell span="full">
              <StaggeredSection>
                <AppErrorBoundary>
                  <LearningMapCard />
                </AppErrorBoundary>
              </StaggeredSection>
            </BentoCell>
          </BentoGrid>
        </section>

        {/* Zone 6: Your Progress */}
        <section aria-label="Your progress" className="animate-section-reveal">
          <div className="mb-3 flex items-center gap-2 sm:mb-4">
            <SectionHeading icon={ChartUpIcon} label="Your Progress" />
          </div>
          <BentoGrid>
            <BentoCell span="full">
              <StaggeredSection>
                <StatsRow />
              </StaggeredSection>
            </BentoCell>
            <BentoCell>
              <StaggeredSection>
                <AchievementShowcase />
              </StaggeredSection>
            </BentoCell>
            <BentoCell>
              <StaggeredSection>
                <CompetitionCard />
              </StaggeredSection>
            </BentoCell>
          </BentoGrid>
        </section>

        {/* Zone 7: Tools & Extras */}
        <section aria-label="Tools" className="animate-section-reveal">
          <div className="mb-3 flex items-center gap-2 sm:mb-4">
            <SectionHeading icon={Settings02Icon} label="Tools" />
          </div>
          <BentoGrid>
            <BentoCell span="full">
              <StaggeredSection>
                <FocusTimerCard />
              </StaggeredSection>
            </BentoCell>
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
            <BentoCell span="full">
              <StaggeredSection>
                <PronunciationChartCard />
              </StaggeredSection>
            </BentoCell>
            <BentoCell>
              <StaggeredSection>
                <WordOfDayCard />
              </StaggeredSection>
            </BentoCell>
          </BentoGrid>
        </section>
      </div>
    </StaggerProvider>
  );
}
