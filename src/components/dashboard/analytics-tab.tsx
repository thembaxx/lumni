"use client";

import dynamic from "next/dynamic";
import { type ReactNode, useCallback, useRef, useState } from "react";
import { StaggeredSection, StaggerProvider } from "@/components/shared/stagger-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/auth-context";

function LazySection({ children, className }: { children: ReactNode; className?: string }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const setRef = useCallback((node: HTMLDivElement | null) => {
    (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);
  }, []);

  return (
    <div ref={setRef} className={className}>
      {isVisible ? children : <Skeleton className="h-48 rounded-card" />}
    </div>
  );
}

function GridCell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

const ComparativeAnalyticsPanel = dynamic(
  () =>
    import("@/components/dashboard/analytics/comparative-analytics-panel").then(
      (mod) => mod.ComparativeAnalyticsPanel,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 items-center justify-center rounded-card border border-dashed bg-system-surface">
        <Skeleton className="h-full w-full rounded-card" />
      </div>
    ),
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

const RewardChestPanel = dynamic(
  () =>
    import("@/components/gamification/reward-chest/reward-chest-panel").then(
      (m) => m.RewardChestPanel,
    ),
  { ssr: false, loading: () => <Skeleton className="h-32 rounded-card" /> },
);

const MasteryHeatmap = dynamic(
  () => import("@/components/dashboard/mastery-heatmap").then((m) => m.MasteryHeatmap),
  { ssr: false, loading: () => <Skeleton className="h-48 rounded-card" /> },
);

export function AnalyticsTab() {
  const { user } = useAuth();
  const isLoggedIn = !!user;

  if (!isLoggedIn) return null;

  return (
    <StaggerProvider baseDelay={0.02}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4 lg:gap-5">
        <GridCell className="sm:col-span-2 lg:col-span-3">
          <StaggeredSection>
            <ComparativeAnalyticsPanel />
          </StaggeredSection>
        </GridCell>

        <GridCell className="sm:col-span-2 lg:col-span-3">
          <StaggeredSection>
            <StatsRow />
          </StaggeredSection>
        </GridCell>

        <GridCell className="lg:col-span-2">
          <LazySection>
            <LeaderboardCard />
          </LazySection>
        </GridCell>

        <StaggeredSection>
          <AchievementShowcase />
        </StaggeredSection>

        <StaggeredSection>
          <RewardChestPanel />
        </StaggeredSection>

        <GridCell className="lg:col-span-3">
          <LazySection>
            <Card>
              <CardHeader>
                <CardTitle className="font-bold text-base tracking-tight">
                  Mastery Heatmap
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MasteryHeatmap />
              </CardContent>
            </Card>
          </LazySection>
        </GridCell>
      </div>
    </StaggerProvider>
  );
}
