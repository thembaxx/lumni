"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { schedulePlanAwareReminder } from "@/lib/services/notification-service";
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
	markPlanStale,
	type StudyPlan,
	type StudySession,
	saveStudyPlan,
	syncStudyPlanToAppwrite,
	updateStudySession,
} from "@/lib/utils/study-planner";

export interface GeneratePlanSettings {
	targetAps?: number;
	dailyStudyMinutes?: number;
	includeWeekends?: boolean;
	horizonDays?: number;
}

export interface UseStudyPlannerReturn {
	plan: StudyPlan;
	todaySessions: StudySession[];
	upcomingSessions: StudySession[];
	upcomingExams: ExamDate[];
	stats: ReturnType<typeof getStudyStats>;
	stale: boolean;
	addSession: (session: Omit<StudySession, "id">) => void;
	updateSession: (id: string, updates: Partial<StudySession>) => void;
	removeSession: (id: string) => void;
	markComplete: (id: string) => void;
	addExam: (exam: Omit<ExamDate, "id" | "daysUntil">) => void;
	removeExam: (id: string) => void;
	autoSchedule: (
		subjects: string[],
		weakTopics: Record<string, string[]>,
	) => void;
	generatePlan: (settings?: GeneratePlanSettings) => Promise<void>;
	isGenerating: boolean;
	refresh: () => void;
}

export function useStudyPlanner(): UseStudyPlannerReturn {
	const { user } = useAuth();
	const [plan, setPlan] = useState<StudyPlan>(() => loadStudyPlan());
	const [todaySessions, setTodaySessions] = useState<StudySession[]>([]);
	const [upcomingSessions, setUpcomingSessions] = useState<StudySession[]>([]);
	const [upcomingExams, setUpcomingExams] = useState<ExamDate[]>([]);
	const [stats, setStats] = useState(() => getStudyStats());
	const [isGenerating, setIsGenerating] = useState(false);

	const refresh = useCallback(() => {
		const p = loadStudyPlan();
		setPlan(p);
		setTodaySessions(getTodaySessions());
		setUpcomingSessions(getUpcomingSessions(7));
		setUpcomingExams(getUpcomingExams());
		setStats(getStudyStats());
	}, []);

	useEffect(() => {
		refresh();
		const interval = setInterval(refresh, 60000);
		return () => clearInterval(interval);
	}, [refresh]);

	const addSession = useCallback(
		(session: Omit<StudySession, "id">) => {
			addStudySession(session);
			schedulePlanAwareReminder();
			if (user?.$id)
				syncStudyPlanToAppwrite(user.$id).catch((e) =>
					console.warn("Sync session failed:", e),
				);
			refresh();
		},
		[refresh, user],
	);

	const updateSession = useCallback(
		(id: string, updates: Partial<StudySession>) => {
			updateStudySession(id, updates);
			refresh();
		},
		[refresh],
	);

	const removeSession = useCallback(
		(id: string) => {
			deleteStudySession(id);
			if (user?.$id)
				syncStudyPlanToAppwrite(user.$id).catch((e) =>
					console.warn("Sync session failed:", e),
				);
			refresh();
		},
		[refresh, user],
	);

	const markComplete = useCallback(
		(id: string) => {
			updateStudySession(id, {
				completed: true,
				completedAt: Date.now(),
			});
			markPlanStale();
			if (user?.$id)
				syncStudyPlanToAppwrite(user.$id).catch((e) =>
					console.warn("Sync markComplete failed:", e),
				);
			refresh();
		},
		[refresh, user],
	);

	const addExam = useCallback(
		(exam: Omit<ExamDate, "id" | "daysUntil">) => {
			addExamDate(exam);
			if (user?.$id)
				syncStudyPlanToAppwrite(user.$id).catch((e) =>
					console.warn("Sync addExam failed:", e),
				);
			refresh();
		},
		[refresh, user],
	);

	const removeExam = useCallback(
		(id: string) => {
			deleteExamDate(id);
			if (user?.$id)
				syncStudyPlanToAppwrite(user.$id).catch((e) =>
					console.warn("Sync removeExam failed:", e),
				);
			refresh();
		},
		[refresh, user],
	);

	const autoSchedule = useCallback(
		(subjects: string[], weakTopics: Record<string, string[]>) => {
			autoScheduleSessions(subjects, weakTopics);
			schedulePlanAwareReminder();
			refresh();
		},
		[refresh],
	);

	const generatePlan = useCallback(
		async (settings?: GeneratePlanSettings) => {
			setIsGenerating(true);
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

				// Load plan to get exam dates for the algorithm
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

				// Build exam date lookup for type conversion
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

				// Replace old auto-scheduled sessions
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
				if (user?.$id)
					syncStudyPlanToAppwrite(user.$id).catch((e) =>
						console.warn("Sync plan failed:", e),
					);
				refresh();
			} catch (error) {
				console.error("Failed to generate study plan:", error);
			} finally {
				setIsGenerating(false);
			}
		},
		[refresh, user?.$id],
	);

	return {
		plan,
		todaySessions,
		upcomingSessions,
		upcomingExams,
		stats,
		stale: plan.stale,
		addSession,
		updateSession,
		removeSession,
		markComplete,
		addExam,
		removeExam,
		autoSchedule,
		generatePlan,
		isGenerating,
		refresh,
	};
}
