"use client";

import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { fetchSubjects } from "@/lib/server";

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

function useUserSubjects(userId: string): UseQueryResult<UserSubjectsResult> {
	const targetUserId = userId;

	return useQuery<UserSubjectsResult>({
		queryKey: ["user-subjects", targetUserId],
		queryFn: async () => {
			const result = await fetchSubjects(targetUserId);
			return result;
		},
		staleTime: 1000 * 60 * 5,
		retry: 3,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
		refetchOnWindowFocus: true,
		refetchOnMount: true,
	});
}
