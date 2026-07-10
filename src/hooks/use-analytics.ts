"use client";

import { createApiQuery } from "@/hooks/use-hook-factories";
import { analyticsEngine } from "@/lib/analytics-engine";
import type { OverallAnalytics } from "@/lib/analytics-engine/types";

export type {
  AnalyticsRecommendation,
  OverallAnalytics,
  PerformanceHistoryItem,
  SubjectAnalytics,
  TopicPerformance,
} from "@/lib/analytics-engine";

const useAnalyticsQuery = createApiQuery<OverallAnalytics, void>({
  queryKey: ["analytics"],
  fetchFn: () => analyticsEngine.compute(),
  staleTime: 1000 * 60 * 30,
});

export function useAnalytics() {
  const { data, isPending, refetch } = useAnalyticsQuery(undefined);

  return {
    analytics: data ?? null,
    isLoading: isPending,
    refresh: () => {
      refetch();
    },
  };
}
