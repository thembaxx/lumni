"use client";

import { useQuery } from "@tanstack/react-query";

export interface CuratedProblem {
	id: string;
	questionText: string;
	solution: string;
	steps: string[];
	difficulty: string;
	topic: string;
}

interface CuratedProblemsResponse {
	problems: CuratedProblem[];
	subject: string;
	topic: string;
	count: number;
}

interface UseCuratedProblemsParams {
	subject: string;
	topic?: string;
	count?: number;
	enabled?: boolean;
}

export function useCuratedProblems({
	subject,
	topic,
	count = 5,
	enabled = true,
}: UseCuratedProblemsParams) {
	return useQuery<CuratedProblemsResponse>({
		queryKey: ["curated-problems", subject, topic, count],
		queryFn: async () => {
			const res = await fetch("/api/curated-problems", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ subject, topic, count }),
			});
			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				throw new Error(err.error || "Failed to generate problems");
			}
			return res.json();
		},
		enabled: enabled && !!subject,
		staleTime: 1000 * 60 * 60,
		gcTime: 1000 * 60 * 60 * 24,
		retry: 1,
	});
}
