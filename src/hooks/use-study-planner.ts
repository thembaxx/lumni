"use client";

import { useCallback, useEffect, useState } from "react";
import { schedulePlanAwareReminder } from "@/lib/services/notification-service";
import {
	addExamDate,
	addStudySession,
	autoScheduleSessions,
	deleteExamDate,
	deleteStudySession,
	type ExamDate,
	getStudyStats,
	getTodaySessions,
	getUpcomingExams,
	getUpcomingSessions,
	loadStudyPlan,
	type StudyPlan,
	type StudySession,
	saveStudyPlan,
	updateStudySession,
} from "@/lib/utils/study-planner";

export interface GeneratePlanSettings {
	targetAps?: number;
	dailyStudyMinutes?: number;
}

export interface UseStudyPlannerReturn {
	plan: StudyPlan;
	todaySessions: StudySession[];
	upcomingSessions: StudySession[];
	upcomingExams: ExamDate[];
	stats: ReturnType<typeof getStudyStats>;
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
	const [plan, setPlan] = useState<StudyPlan>(loadStudyPlan());
	const [todaySessions, setTodaySessions] = useState<StudySession[]>([]);
	const [upcomingSessions, setUpcomingSessions] = useState<StudySession[]>([]);
	const [upcomingExams, setUpcomingExams] = useState<ExamDate[]>([]);
	const [stats, setStats] = useState(getStudyStats());
	const [isGenerating, setIsGenerating] = useState(false);

	const refresh = useCallback(() => {
		setPlan(loadStudyPlan());
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
			refresh();
		},
		[refresh],
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
			refresh();
		},
		[refresh],
	);

	const markComplete = useCallback(
		(id: string) => {
			updateStudySession(id, {
				completed: true,
				completedAt: Date.now(),
			});
			refresh();
		},
		[refresh],
	);

	const addExam = useCallback(
		(exam: Omit<ExamDate, "id" | "daysUntil">) => {
			addExamDate(exam);
			refresh();
		},
		[refresh],
	);

	const removeExam = useCallback(
		(id: string) => {
			deleteExamDate(id);
			refresh();
		},
		[refresh],
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
				const endDate = new Date(today);
				endDate.setDate(endDate.getDate() + 30);

				const planSettings = {
					targetAps: settings?.targetAps ?? 25,
					dailyStudyMinutes: settings?.dailyStudyMinutes ?? 30,
					preferredStudyTime: "morning" as const,
					studyDays: [1, 2, 3, 4, 5],
					startDate: today.toISOString().split("T")[0],
					endDate: endDate.toISOString().split("T")[0],
				};

				const service = getStudyPlannerService();
				const algorithmPlan = await service.generateStudyPlan(planSettings);

				const existingPlan = loadStudyPlan();
				const newSessions: Omit<StudySession, "id">[] = algorithmPlan.topics
					.filter((t) => t.scheduledDate)
					.map((t) => ({
						subject: t.subjectId,
						topic: t.topicId,
						type: "quiz" as const,
						scheduledAt: new Date(t.scheduledDate!).getTime(),
						duration: Math.round(t.estimatedMinutes),
						completed: t.isCompleted,
					}));

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
				saveStudyPlan(existingPlan);
				schedulePlanAwareReminder();
				refresh();
			} catch (error) {
				console.error("Failed to generate study plan:", error);
			} finally {
				setIsGenerating(false);
			}
		},
		[refresh],
	);

	return {
		plan,
		todaySessions,
		upcomingSessions,
		upcomingExams,
		stats,
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
