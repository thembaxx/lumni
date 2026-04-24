"use client";

import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { fetchSubjects } from "@/lib/server/actions";

export interface UserSubject {
	id: string;
	name: string;
	code: string;
	description?: string;
	category: string;
	color?: string;
}

export interface UserSubjectsResult {
	subjects: UserSubject[];
	selectedSubjectIds: string[];
}

const DEFAULT_USER_ID = "demo-user";

export function useUserSubjects(
	userId?: string,
): UseQueryResult<UserSubjectsResult> {
	const targetUserId = userId || DEFAULT_USER_ID;

	return useQuery({
		queryKey: ["user-subjects", targetUserId],
		queryFn: async () => {
			const result = await fetchSubjects(targetUserId);
			return result as UserSubjectsResult;
		},
		staleTime: 1000 * 60 * 5,
		retry: 3,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
		refetchOnWindowFocus: true,
		refetchOnMount: true,
	}) as UseQueryResult<UserSubjectsResult>;
}
