"use client";

import { fetchUserProgress } from "@/lib/server";
import { createApiQuery } from "./use-hook-factories";

export interface UserProgress {
  streak: number;
  questionsAnswered: number;
  accuracy: number;
}

export const useUserProgress = createApiQuery<UserProgress, string>({
  queryKey: (userId) => ["user-progress", userId],
  fetchFn: fetchUserProgress,
  staleTime: 1000 * 60 * 5,
  enabled: (userId) => !!userId,
  retry: 3,
  extraOptions: {
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  },
});
