import type { CompetencyService } from "@/lib/competency-engine/competency-service";
import { competencyService as defaultCompetencyService } from "@/lib/competency-engine/competency-service";
import type { ProgressService } from "@/lib/services/progress-service";
import { progressService as defaultProgressService } from "@/lib/services/progress-service";
import { generateStudyPlan } from "./algorithms";
import type { StudyPlan, StudyPlanSettings, SubjectCompetency } from "./types";

const KNOWN_SUBJECTS = [
	{ id: "mathematics", name: "Mathematics" },
	{ id: "physical-sciences", name: "Physical Sciences" },
	{ id: "english", name: "English" },
	{ id: "accounting", name: "Accounting" },
	{ id: "life-sciences", name: "Life Sciences" },
	{ id: "geography", name: "Geography" },
	{ id: "history", name: "History" },
	{ id: "business-studies", name: "Business Studies" },
	{ id: "economics", name: "Economics" },
] as const;

export class StudyPlannerService {
	constructor(
		private competencyService: CompetencyService = defaultCompetencyService,
		_progressService: ProgressService = defaultProgressService,
	) {}

	async generateStudyPlan(settings: StudyPlanSettings): Promise<StudyPlan> {
		const subjects = await this.getAllSubjectsCompetency();
		return generateStudyPlan(settings, subjects);
	}

	async updateStudyPlan(currentPlan: StudyPlan): Promise<StudyPlan> {
		const updatedSubjects = await this.getAllSubjectsCompetency();
		return generateStudyPlan(currentPlan.settings, updatedSubjects);
	}

	private async getAllSubjectsCompetency(): Promise<SubjectCompetency[]> {
		const results = await Promise.allSettled(
			KNOWN_SUBJECTS.map(async (subject) => {
				const [summary, records] = await Promise.all([
					this.competencyService.getMasterySummary(subject.id),
					this.competencyService.getCompetencies(subject.id),
				]);
				const topicIds: string[] = [];
				for (const r of records) {
					if (r.topicId) topicIds.push(r.topicId);
				}
				const uniqueTopics = [...new Set(topicIds)];

				return {
					subjectId: subject.id,
					level: summary.averageScore,
					targetLevel: 80,
					weight: 1 / KNOWN_SUBJECTS.length,
					topics: uniqueTopics,
				};
			}),
		);

		return results.map((r, i) => {
			if (r.status === "fulfilled") return r.value;
			return {
				subjectId: KNOWN_SUBJECTS[i].id,
				level: 50,
				targetLevel: 80,
				weight: 1 / KNOWN_SUBJECTS.length,
				topics: [],
			};
		});
	}
}

// We'll make this a singleton
let instance: StudyPlannerService | null = null;

export function getStudyPlannerService(): StudyPlannerService {
	if (instance === null) {
		instance = new StudyPlannerService();
	}
	return instance;
}
