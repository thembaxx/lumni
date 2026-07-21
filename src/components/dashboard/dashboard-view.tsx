"use client";

import dynamic from "next/dynamic";
import { QuizStartCard } from "@/components/dashboard/quiz-start-card";
import { DailyChallengeCard } from "@/components/dashboard/daily-challenge-card";
import { HeroBanner } from "@/components/dashboard/dashboard-hero";
import { WordOfDayCard } from "@/components/dashboard/word-of-day";
import { WeakTopicsCard } from "@/components/dashboard/weak-topics-card";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/auth-context";
import { AnonymousUpsell } from "@/components/dashboard/anonymous-upsell";
import { StaggeredSection, StaggerProvider } from "@/components/shared/stagger-provider";
import { BentoGrid, BentoCell } from "./parts/bento-grid";
import { StreakBadge } from "./streak-badge";

const FocusTimerCard = dynamic(
  () => import("@/components/dashboard/focus-timer-card").then((m) => m.FocusTimerCard),
  { ssr: false, loading: () => <Skeleton className="h-20 rounded-card" /> },
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
        <section aria-label="Today" className="animate-section-reveal">
          <HeroBanner />
          <div className="mt-4 flex items-center gap-4">
            <StreakBadge />
            <div className="h-8 w-px bg-border/30" role="separator" aria-label="Separator" />
            <FocusTimerCard />
          </div>
        </section>

        <section aria-label="Actions" className="animate-section-reveal">
          <BentoGrid>
            <BentoCell span="full">
              <StaggeredSection>
                <DailyChallengeCard streak={boltStreak} />
              </StaggeredSection>
            </BentoCell>
            <StaggeredSection>
              <WordOfDayCard />
            </StaggeredSection>
            <BentoCell span="2col">
              <StaggeredSection>
                <WeakTopicsCard />
              </StaggeredSection>
            </BentoCell>
            <BentoCell span="full">
              <StaggeredSection>
                <AppErrorBoundary>
                  <QuizStartCard onStart={onStartQuiz} />
                </AppErrorBoundary>
              </StaggeredSection>
            </BentoCell>
          </BentoGrid>
        </section>
      </div>
    </StaggerProvider>
  );
}
