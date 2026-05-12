"use client";

import { useQuery } from "@tanstack/react-query";
import { competencyService } from "@/lib/competency-engine";
import type { CompetencyRecord } from "@/lib/competency-engine/types";

interface CompetencySummary {
	total: number;
	novice: number;
	developing: number;
	proficient: number;
	mastered: number;
	averageScore: number;
}

export function useCompetencies(subjectId: string | undefined) {
	return useQuery({
		queryKey: ["competencies", subjectId],
		queryFn: async (): Promise<{
			records: CompetencyRecord[];
			summary: CompetencySummary;
		}> => {
			const records = await competencyService.getCompetencies(subjectId!);
			const summary = await competencyService.getMasterySummary(subjectId!);
			return { records, summary };
		},
		enabled: !!subjectId,
		staleTime: 1000 * 60 * 5,
		retry: 1,
	});
}
