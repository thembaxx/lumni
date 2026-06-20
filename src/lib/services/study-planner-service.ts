import { dexieDataAccess } from "@/lib/db";
import type { StudyDataAccess } from "@/lib/db/data-access";
import { schedulePlanAwareReminder } from "@/lib/services/notification-service";
import { apiFetch } from "@/lib/shared/api-fetch";
import { logError } from "@/lib/shared/logger";
import {
	addExamDate,
	addStudySession,
	autoScheduleSessions,
	clearPlanStale,
	deleteExamDate,
	deleteStudySession,
	type ExamDate,
	type ExamDateInfo,
	getStudyStats,
	getTodaySessions,
	getUpcomingExams,
	getUpcomingSessions,
	loadStudyPlan,
	loadStudyPlanFromDexie,
	markPlanStale,
	type StudyPlan,
	type StudySession,
	saveStudyPlan,
	updateStudySession,
} from "@/lib/utils/study-planner";

export interface StudyPlannerDeps {
	db: StudyDataAccess;
}

const DEFAULT_DEPS: StudyPlannerDeps = { db: dexieDataAccess };

type StateListener = (plan: StudyPlan) => void;

export interface PlannerSnapshot {
	plan: StudyPlan;
	todaySessions: StudySession[];
	upcomingSessions: StudySession[];
	upcomingExams: ExamDate[];
	stats: ReturnType<typeof getStudyStats>;
}

export class StudyPlannerService {
	private plan: StudyPlan;
	private listeners: Set<StateListener> = new Set();
	private userId: string | null = null;
	private db: StudyDataAccess;

	constructor(deps?: Partial<StudyPlannerDeps>) {
		const resolved = { ...DEFAULT_DEPS, ...deps };
		this.db = resolved.db;
		this.plan = loadStudyPlan();
	}

	subscribe(listener: StateListener): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	setUserId(userId: string | null) {
		this.userId = userId;
	}

	getSnapshot(): PlannerSnapshot {
		return {
			plan: this.plan,
			todaySessions: getTodaySessions(),
			upcomingSessions: getUpcomingSessions(7),
			upcomingExams: getUpcomingExams(),
			stats: getStudyStats(),
		};
	}

	async loadFromDexie(): Promise<void> {
		try {
			const dexiePlan = await loadStudyPlanFromDexie();
			if (dexiePlan !== this.plan) {
				this.plan = dexiePlan;
				this.notify();
			}
		} catch (err) {
			logError("StudyPlannerService.loadFromDexie", err);
		}
	}

	refresh(): void {
		this.plan = loadStudyPlan();
		this.notify();
	}

	addSession(session: Omit<StudySession, "id">): void {
		addStudySession(session);
		schedulePlanAwareReminder();
		this.syncToAppwrite();
		this.refresh();
	}

	updateSession(id: string, updates: Partial<StudySession>): void {
		updateStudySession(id, updates);
		this.refresh();
	}

	removeSession(id: string): void {
		deleteStudySession(id);
		this.syncToAppwrite();
		this.refresh();
	}

	markComplete(id: string): void {
		updateStudySession(id, { completed: true, completedAt: Date.now() });
		markPlanStale();
		this.syncToAppwrite();
		this.refresh();
	}

	addExam(exam: Omit<ExamDate, "id" | "daysUntil">): void {
		addExamDate(exam);
		this.syncToAppwrite();
		this.refresh();
	}

	removeExam(id: string): void {
		deleteExamDate(id);
		this.syncToAppwrite();
		this.refresh();
	}

	autoSchedule(subjects: string[], weakTopics: Record<string, string[]>): void {
		autoScheduleSessions(subjects, weakTopics);
		schedulePlanAwareReminder();
		this.refresh();
	}

	async generatePlan(settings?: {
		targetAps?: number;
		dailyStudyMinutes?: number;
		includeWeekends?: boolean;
		horizonDays?: number;
	}): Promise<void> {
		try {
			const { getStudyPlannerService } = await import(
				"@/lib/study-planner/study-planner-service"
			);

			const today = new Date();
			const horizonDays = settings?.horizonDays ?? 30;
			const endDate = new Date(today);
			endDate.setDate(endDate.getDate() + horizonDays);
			const studyDays = settings?.includeWeekends
				? [0, 1, 2, 3, 4, 5, 6]
				: [1, 2, 3, 4, 5];

			const planSettings = {
				targetAps: settings?.targetAps ?? 25,
				dailyStudyMinutes: settings?.dailyStudyMinutes ?? 30,
				preferredStudyTime: "morning" as const,
				studyDays,
				startDate: today.toISOString().split("T")[0],
				endDate: endDate.toISOString().split("T")[0],
			};

			const existingPlan = loadStudyPlan();
			const examDateInfos: ExamDateInfo[] = existingPlan.examDates.map(
				(ed) => ({
					subjectId: ed.subject,
					date: new Date(ed.date).toISOString().split("T")[0],
				}),
			);

			const service = getStudyPlannerService();
			const algorithmPlan = await service.generateStudyPlan(
				planSettings,
				examDateInfos,
			);

			const examSubjectsByDate = new Map<string, Set<string>>();
			for (const ed of existingPlan.examDates) {
				const dateStr = new Date(ed.date).toISOString().split("T")[0];
				if (!examSubjectsByDate.has(dateStr))
					examSubjectsByDate.set(dateStr, new Set());
				examSubjectsByDate.get(dateStr)?.add(ed.subject);
			}

			const newSessions: Omit<StudySession, "id">[] = [];
			for (const t of algorithmPlan.topics) {
				const scheduledDate = t.scheduledDate;
				if (scheduledDate) {
					const isExamDay = examSubjectsByDate
						.get(scheduledDate)
						?.has(t.subjectId);
					newSessions.push({
						subject: t.subjectId,
						topic: t.topicId,
						type: isExamDay ? "review" : ("quiz" as const),
						scheduledAt: new Date(scheduledDate).getTime(),
						duration: Math.round(t.estimatedMinutes),
						completed: t.isCompleted,
					});
				}
			}

			existingPlan.sessions = existingPlan.sessions.filter(
				(s) => s.type !== "quiz" || s.topic === undefined,
			);
			for (const s of newSessions) {
				existingPlan.sessions.push({
					...s,
					id: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
				});
			}
			existingPlan.generatedAt = Date.now();
			clearPlanStale();
			saveStudyPlan(existingPlan);
			schedulePlanAwareReminder();
			this.plan = existingPlan;
			this.syncToAppwrite();
			this.notify();
		} catch (error) {
			logError("GenerateStudyPlan", error);
			console.error("Failed to generate study plan:", error);
		}
	}

	private notify() {
		const snapshot = this.getSnapshot();
		for (const listener of this.listeners) {
			listener(snapshot.plan);
		}
	}

	private syncToAppwrite() {
		if (!this.userId) return;
		syncStudyPlanToAppwrite(this.userId).catch((e) =>
			console.warn("Sync study plan failed:", e),
		);
	}
}

async function syncStudyPlanToAppwrite(userId: string): Promise<void> {
	const plan = loadStudyPlan();
	await apiFetch("/api/study-plans", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ userId, plan: JSON.stringify(plan) }),
	});
}
