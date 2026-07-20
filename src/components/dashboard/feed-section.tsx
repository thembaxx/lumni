"use client";

import { useQuery } from "@tanstack/react-query";
import { PersonalizedFeed } from "@/components/dashboard/personalized-feed";
import { NextBestActionCard } from "@/components/dashboard/next-best-action";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { StaggeredSection } from "@/components/shared/stagger-provider";
import { useFeatureFlag } from "@/hooks/use-feature-flag";
import { getFeed } from "@/lib/retention-loop/next-action";

export function FeedSection({ userId }: { userId: string }) {
  const { enabled: showPersonalizedFeed } = useFeatureFlag("personalized-feed", userId);

  const { data: recommendations } = useQuery({
    queryKey: ["personalized-feed", userId],
    queryFn: async ({ queryKey }) => getFeed(queryKey[1] as string),
    staleTime: 60_000,
    refetchInterval: 60000,
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
