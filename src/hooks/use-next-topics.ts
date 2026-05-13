"use client";

import { useQuery } from "@tanstack/react-query";
import { competencyService, pathEngine } from "@/lib/competency-engine";
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
			const records = await competencyService.getCompetencies(subjectId!);
			const competencyMap = new Map(
				records.map((c) => [`${c.subjectId}:${c.topicId}:${c.bloomLevel}`, c]),
			);
			const recommendations = await pathEngine.getNextTopics(
				subjectId!,
				competencyMap,
			);
			const summary = await competencyService.getMasterySummary(subjectId!);
			return { recommendations, summary };
		},
		enabled: !!subjectId,
		staleTime: 1000 * 60 * 5,
		retry: 1,
	});
}
