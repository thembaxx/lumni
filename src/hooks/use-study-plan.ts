"use client";

import { useQuery } from "@tanstack/react-query";
import { competencyService, pathEngine } from "@/lib/competency-engine";
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
			const allCompetencies: [
				string,
				import("@/lib/competency-engine").CompetencyRecord,
			][] = [];
			for (const subject of subjects) {
				const comps = await competencyService.getCompetencies(subject);
				for (const c of comps) {
					allCompetencies.push([
						`${c.subjectId}:${c.topicId}:${c.bloomLevel}`,
						c,
					]);
				}
			}
			const competencyMap = new Map(allCompetencies);
			const plan = await pathEngine.generateStudyPlan(
				subjects,
				competencyMap,
				days,
				dailyGoalMinutes,
			);
			return { plan, days, dailyGoalMinutes };
		},
		enabled: enabled && subjects.length > 0,
		staleTime: 1000 * 60 * 5,
		retry: 1,
	});
}
