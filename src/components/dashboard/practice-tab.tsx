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
  { ssr: false, loading: () => <Skeleton className="h-48 rounded-4xl" /> },
);

const CompetencyOverview = dynamic(
  () => import("@/components/dashboard/competency-overview").then((m) => m.CompetencyOverview),
  { ssr: false, loading: () => <Skeleton className="h-32 rounded-4xl" /> },
);

const FocusTimerCard = dynamic(
  () => import("@/components/dashboard/focus-timer-card").then((m) => m.FocusTimerCard),
  { ssr: false, loading: () => <Skeleton className="h-20 rounded-4xl" /> },
);

const LessonLibraryCard = dynamic(
  () => import("@/components/dashboard/lesson-library-card").then((m) => m.LessonLibraryCard),
  { ssr: false, loading: () => <Skeleton className="h-32 rounded-4xl" /> },
);

const MyAssignments = dynamic(
  () => import("@/components/dashboard/my-assignments").then((m) => m.MyAssignments),
  { ssr: false, loading: () => <Skeleton className="h-32 rounded-4xl" /> },
);

const OfflinePackManager = dynamic(
  () => import("@/components/dashboard/offline-packs").then((m) => m.OfflinePackManager),
  { ssr: false, loading: () => <Skeleton className="h-32 rounded-4xl" /> },
);

const VocabularyListCard = dynamic(
  () => import("@/components/vocabulary/vocabulary-list-card").then((m) => m.VocabularyListCard),
  { ssr: false, loading: () => <Skeleton className="h-32 rounded-4xl" /> },
);

interface PracticeTabProps {
  onStartQuiz: (subject: string) => void;
}

export function PracticeTab({ onStartQuiz }: PracticeTabProps) {
  const { user, isAnonymous } = useAuth();
  const isLoggedIn = !!user && !isAnonymous;

  return (
    <StaggerProvider baseDelay={0.02}>
      <StaggeredSection>
        <FocusTimerCard />
      </StaggeredSection>
      {isAnonymous && (
        <StaggeredSection>
          <AnonymousUpsell />
        </StaggeredSection>
      )}
      <StaggeredSection>
        <QuestionOfTheDayCard />
      </StaggeredSection>
      {isLoggedIn && (
        <StaggeredSection>
          <AppErrorBoundary>
            <NextBestActionCard />
          </AppErrorBoundary>
        </StaggeredSection>
      )}
      {isLoggedIn && (
        <StaggeredSection>
          <TodayFocusCard />
        </StaggeredSection>
      )}
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
        <StaggeredSection>
          <RecentQuestionsCard />
        </StaggeredSection>
      )}
      {isLoggedIn && (
        <StaggeredSection>
          <StudyPlanOverview />
        </StaggeredSection>
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
      <StaggeredSection>
        <OfflinePackManager />
      </StaggeredSection>
      {isLoggedIn && (
        <StaggeredSection>
          <WeakTopicsCard />
        </StaggeredSection>
      )}
      <StaggeredSection>
        <StaggerList>
          <QuickActions />
        </StaggerList>
      </StaggeredSection>
      <StaggeredSection>
        <QuizStartCard onStart={onStartQuiz} />
      </StaggeredSection>
    </StaggerProvider>
  );
}
