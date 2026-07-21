"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { BentoGrid, BentoCell } from "@/components/dashboard/parts/bento-grid";
import { StaggeredSection, StaggerProvider } from "@/components/shared/stagger-provider";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { useAuth } from "@/lib/auth/auth-context";

const StreakCard = dynamic(
  () => import("@/components/dashboard/streak-card").then((m) => m.StreakCard),
  { ssr: false, loading: () => <Skeleton className="h-24 rounded-card" /> },
);

const AchievementShowcase = dynamic(
  () => import("@/components/dashboard/achievement-showcase").then((m) => m.AchievementShowcase),
  { ssr: false, loading: () => <Skeleton className="h-20 rounded-card" /> },
);

const CompetencyOverview = dynamic(
  () => import("@/components/dashboard/competency-overview").then((m) => m.CompetencyOverview),
  { ssr: false, loading: () => <Skeleton className="h-48 rounded-card" /> },
);

const MasteryHeatmap = dynamic(
  () => import("@/components/dashboard/mastery-heatmap").then((m) => m.MasteryHeatmap),
  { ssr: false, loading: () => <Skeleton className="h-48 rounded-card" /> },
);

const ComparativeAnalyticsPanel = dynamic(
  () =>
    import("@/components/dashboard/analytics/comparative-analytics-panel").then(
      (mod) => mod.ComparativeAnalyticsPanel,
    ),
  { ssr: false, loading: () => <Skeleton className="h-64 rounded-card" /> },
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

export function ProgressPageClient() {
  const { user, isAnonymous } = useAuth();
  const isLoggedIn = !!user && !isAnonymous;

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground">Sign in to see your progress</p>
      </div>
    );
  }

  return (
    <StaggerProvider baseDelay={0.03}>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="font-heading font-extrabold text-(--fs-heading-2) text-foreground tracking-tight">
            Progress
          </h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Track your achievements, mastery, and learning journey
          </p>
        </div>

        <section aria-label="Overview">
          <SectionLabel label="Overview" />
          <BentoGrid>
            <StaggeredSection>
              <StreakCard />
            </StaggeredSection>
            <BentoCell span="2col">
              <StaggeredSection>
                <AchievementShowcase />
              </StaggeredSection>
            </BentoCell>
          </BentoGrid>
        </section>

        <section aria-label="Subject Mastery">
          <SectionLabel label="Subject Mastery" />
          <BentoGrid>
            <BentoCell span="2col">
              <StaggeredSection>
                <CompetencyOverview />
              </StaggeredSection>
            </BentoCell>
            <BentoCell span="full">
              <StaggeredSection>
                <MasteryHeatmap />
              </StaggeredSection>
            </BentoCell>
          </BentoGrid>
        </section>

        <section aria-label="Analytics">
          <SectionLabel label="Analytics" />
          <BentoGrid>
            <BentoCell span="full">
              <StaggeredSection>
                <AppErrorBoundary>
                  <ComparativeAnalyticsPanel />
                </AppErrorBoundary>
              </StaggeredSection>
            </BentoCell>
          </BentoGrid>
        </section>
      </div>
    </StaggerProvider>
  );
}
