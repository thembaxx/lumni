"use client";

import { useQuery } from "@tanstack/react-query";
import { analyticsEngine } from "@/lib/analytics-engine";

export type {
  AnalyticsRecommendation,
  OverallAnalytics,
  PerformanceHistoryItem,
  SubjectAnalytics,
  TopicPerformance,
} from "@/lib/analytics-engine";

export function useAnalytics() {
  const { data, isPending, refetch } = useQuery({
    queryKey: ["analytics"],
    queryFn: () => analyticsEngine.compute(),
  });

  return {
    analytics: data ?? null,
    isLoading: isPending,
    refresh: () => {
      refetch();
    },
  };
}
