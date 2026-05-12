"use client";

import { useQuery } from "@tanstack/react-query";
import type { StudyPlanDay } from "@/lib/competency-engine/path-engine";

interface UseStudyPlanOptions {
	subjects: string[];
	days?: number;
	dailyGoalMinutes?: number;
	enabled?: boolean;
}

export function useStudyPlan(options: UseStudyPlanOptions) {
	const { subjects, days = 7, dailyGoalMinutes = 30, enabled = true } = options;

	return useQuery({
		queryKey: ["study-plan", subjects, days, dailyGoalMinutes],
		queryFn: async (): Promise<{
			plan: StudyPlanDay[];
			days: number;
			dailyGoalMinutes: number;
		}> => {
			const params = new URLSearchParams({
				subjects: subjects.join(","),
				days: String(days),
				dailyGoalMinutes: String(dailyGoalMinutes),
			});
			const response = await fetch(
				`/api/engine/study-plan?${params.toString()}`,
			);
			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Failed to generate study plan");
			}
			return response.json();
		},
		enabled: enabled && subjects.length > 0,
		staleTime: 1000 * 60 * 5,
		retry: 1,
	});
}
