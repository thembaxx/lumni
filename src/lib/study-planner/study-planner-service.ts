import type { CompetencyService } from "@/lib/competency-engine/competency-service";
import { competencyService as defaultCompetencyService } from "@/lib/competency-engine/competency-service";
import { sendLocalNotification } from "@/lib/services/notification-service";
import type { ExamDateInfo } from "@/lib/utils/study-planner";
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
	) {}

	async generateStudyPlan(
		settings: StudyPlanSettings,
		examDates: ExamDateInfo[] = [],
	): Promise<StudyPlan> {
		const subjects = await this.getAllSubjectsCompetency();
		const plan = await generateStudyPlan(settings, subjects, examDates);

		// Schedule 15-minute-before push reminders for each session
		if (
			typeof window !== "undefined" &&
			"serviceWorker" in navigator &&
			"Notification" in window &&
			Notification.permission === "granted"
		) {
			for (const topic of plan.topics) {
				if (!topic.scheduledDate) continue;
				const sessionDate = new Date(`${topic.scheduledDate}T09:00:00`);
				if (settings.preferredStudyTime === "afternoon") {
					sessionDate.setHours(14, 0, 0, 0);
				} else if (settings.preferredStudyTime === "evening") {
					sessionDate.setHours(18, 0, 0, 0);
				}
				const reminderTime = sessionDate.getTime() - 15 * 60 * 1000;
				const delay = reminderTime - Date.now();
				if (delay > 0) {
					setTimeout(() => {
						sendLocalNotification(
							"Study Session Reminder",
							`Your ${topic.subjectId} study session on ${topic.topicId} starts in 15 minutes`,
						);
					}, delay);
				}
			}
		}

		return plan;
	}

	async updateStudyPlan(
		currentPlan: StudyPlan,
		examDates: ExamDateInfo[] = [],
	): Promise<StudyPlan> {
		const updatedSubjects = await this.getAllSubjectsCompetency();
		return generateStudyPlan(currentPlan.settings, updatedSubjects, examDates);
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
