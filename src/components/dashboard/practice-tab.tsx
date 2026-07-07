"use client";

import dynamic from "next/dynamic";
import { AnonymousUpsell } from "@/components/dashboard/anonymous-upsell";
import { LearningMapCard } from "@/components/dashboard/learning-map-card";
import { NextBestActionCard } from "@/components/dashboard/next-best-action";
import { QuestionOfTheDayCard } from "@/components/dashboard/question-of-the-day-card";
import { QuickActions } from "@/components/dashboard/quick-actions/quick-actions";
import { QuizStartCard } from "@/components/dashboard/quiz-start-card";
import { RecentQuestionsCard } from "@/components/dashboard/recent-questions-card";
import { StreakCard } from "@/components/dashboard/streak-card";
import { StudyCard } from "@/components/dashboard/study-card";
import { StudyPlanOverview } from "@/components/dashboard/study-plan-overview";
import { TodayFocusCard } from "@/components/dashboard/today-focus-card";
import { WeakTopicsCard } from "@/components/dashboard/weak-topics-card";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { StaggerList } from "@/components/shared/stagger-list";
import { StaggeredSection, StaggerProvider } from "@/components/shared/stagger-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/auth-context";

const BloomTaxonomyWidget = dynamic(
  () => import("@/components/dashboard/bloom-taxonomy-widget").then((m) => m.BloomTaxonomyWidget),
  { ssr: false, loading: () => <Skeleton className="h-48 rounded-card" /> },
);

const CompetencyOverview = dynamic(
  () => import("@/components/dashboard/competency-overview").then((m) => m.CompetencyOverview),
  { ssr: false, loading: () => <Skeleton className="h-48 rounded-card" /> },
);

const FocusTimerCard = dynamic(
  () => import("@/components/dashboard/focus-timer-card").then((m) => m.FocusTimerCard),
  { ssr: false, loading: () => <Skeleton className="h-20 rounded-card" /> },
);

const LessonLibraryCard = dynamic(
  () => import("@/components/dashboard/lesson-library-card").then((m) => m.LessonLibraryCard),
  { ssr: false, loading: () => <Skeleton className="h-52 rounded-card" /> },
);

const MyAssignments = dynamic(
  () => import("@/components/dashboard/my-assignments").then((m) => m.MyAssignments),
  { ssr: false, loading: () => <Skeleton className="h-48 rounded-card" /> },
);

const OfflinePackManager = dynamic(
  () => import("@/components/dashboard/offline-packs").then((m) => m.OfflinePackManager),
  { ssr: false, loading: () => <Skeleton className="h-56 rounded-card" /> },
);

const VocabularyListCard = dynamic(
  () => import("@/components/vocabulary/vocabulary-list-card").then((m) => m.VocabularyListCard),
  { ssr: false, loading: () => <Skeleton className="h-44 rounded-card" /> },
);

function GridSection({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

interface PracticeTabProps {
  onStartQuiz: (subject: string) => void;
}

export function PracticeTab({ onStartQuiz }: PracticeTabProps) {
  const { user, isAnonymous } = useAuth();
  const isLoggedIn = !!user && !isAnonymous;

  return (
    <StaggerProvider baseDelay={0.02}>
      <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
        <GridSection className="sm:col-span-2 lg:col-span-3">
          <StaggeredSection>
            <FocusTimerCard />
          </StaggeredSection>
        </GridSection>

        {isAnonymous && (
          <GridSection className="sm:col-span-2 lg:col-span-3">
            <StaggeredSection>
              <AnonymousUpsell />
            </StaggeredSection>
          </GridSection>
        )}

        <GridSection className="sm:col-span-2 lg:col-span-3">
          <StaggeredSection>
            <QuestionOfTheDayCard />
          </StaggeredSection>
        </GridSection>

        {isLoggedIn && (
          <GridSection className="sm:col-span-2 lg:col-span-3">
            <StaggeredSection>
              <AppErrorBoundary>
                <NextBestActionCard />
              </AppErrorBoundary>
            </StaggeredSection>
          </GridSection>
        )}

        {isLoggedIn && (
          <GridSection className="sm:col-span-2 lg:col-span-3">
            <StaggeredSection>
              <TodayFocusCard />
            </StaggeredSection>
          </GridSection>
        )}

        {isLoggedIn && (
          <GridSection className="lg:col-span-2">
            <StaggeredSection>
              <LessonLibraryCard />
            </StaggeredSection>
          </GridSection>
        )}

        {isLoggedIn && (
          <StaggeredSection>
            <VocabularyListCard />
          </StaggeredSection>
        )}

        {isLoggedIn && (
          <GridSection className="sm:col-span-2 lg:col-span-3">
            <StaggeredSection>
              <AppErrorBoundary>
                <LearningMapCard />
              </AppErrorBoundary>
            </StaggeredSection>
          </GridSection>
        )}

        {isLoggedIn && (
          <StaggeredSection>
            <MyAssignments />
          </StaggeredSection>
        )}

        {isLoggedIn && (
          <StaggeredSection>
            <StudyCard />
          </StaggeredSection>
        )}

        {isLoggedIn && (
          <StaggeredSection>
            <StreakCard />
          </StaggeredSection>
        )}

        {isLoggedIn && (
          <GridSection className="lg:col-span-2">
            <StaggeredSection>
              <RecentQuestionsCard />
            </StaggeredSection>
          </GridSection>
        )}

        {isLoggedIn && (
          <GridSection className="sm:col-span-2 lg:col-span-3">
            <StaggeredSection>
              <StudyPlanOverview />
            </StaggeredSection>
          </GridSection>
        )}

        {isLoggedIn && (
          <StaggeredSection>
            <CompetencyOverview />
          </StaggeredSection>
        )}

        {isLoggedIn && (
          <StaggeredSection>
            <BloomTaxonomyWidget />
          </StaggeredSection>
        )}

        <GridSection className="sm:col-span-2 lg:col-span-3">
          <StaggeredSection>
            <OfflinePackManager />
          </StaggeredSection>
        </GridSection>

        {isLoggedIn && (
          <GridSection className="lg:col-span-2">
            <StaggeredSection>
              <WeakTopicsCard />
            </StaggeredSection>
          </GridSection>
        )}

        <GridSection className="sm:col-span-2 lg:col-span-3">
          <StaggeredSection>
            <StaggerList>
              <QuickActions />
            </StaggerList>
          </StaggeredSection>
        </GridSection>

        <GridSection className="sm:col-span-2 lg:col-span-3">
          <StaggeredSection>
            <QuizStartCard onStart={onStartQuiz} />
          </StaggeredSection>
        </GridSection>
      </div>
    </StaggerProvider>
  );
}
