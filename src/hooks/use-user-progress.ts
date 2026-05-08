"use client";

import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { fetchUserProgress } from "@/lib/server";

export interface UserProgress {
	streak: number;
	questionsAnswered: number;
	accuracy: number;
}

const DEFAULT_USER_ID = "demo-user";

export function useUserProgress(userId?: string): UseQueryResult<UserProgress> {
	const targetUserId = userId || DEFAULT_USER_ID;

	return useQuery({
		queryKey: ["user-progress", targetUserId],
		queryFn: async () => {
			const progress = await fetchUserProgress(targetUserId);
			return progress as UserProgress;
		},
		staleTime: 1000 * 60 * 5,
		retry: 3,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
		refetchOnWindowFocus: true,
		refetchOnMount: true,
	}) as UseQueryResult<UserProgress>;
}
