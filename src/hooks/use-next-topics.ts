"use client";

import { useQuery } from "@tanstack/react-query";
import type { TopicRecommendation } from "@/lib/competency-engine/path-engine";

export function useNextTopics(subjectId: string | undefined) {
	return useQuery({
		queryKey: ["next-topics", subjectId],
		queryFn: async (): Promise<{
			recommendations: TopicRecommendation[];
			summary: {
				total: number;
				novice: number;
				developing: number;
				proficient: number;
				mastered: number;
				averageScore: number;
			};
		}> => {
			const response = await fetch(
				`/api/engine/next-topics?subject=${encodeURIComponent(subjectId!)}`,
			);
			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Failed to fetch next topics");
			}
			return response.json();
		},
		enabled: !!subjectId,
		staleTime: 1000 * 60 * 5,
		retry: 1,
	});
}
