"use client";

import { useCallback, useEffect, useState } from "react";
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
	refresh: () => void;
}

export function useStudyPlanner(): UseStudyPlannerReturn {
	const [plan, setPlan] = useState<StudyPlan>(loadStudyPlan());
	const [todaySessions, setTodaySessions] = useState<StudySession[]>([]);
	const [upcomingSessions, setUpcomingSessions] = useState<StudySession[]>([]);
	const [upcomingExams, setUpcomingExams] = useState<ExamDate[]>([]);
	const [stats, setStats] = useState(getStudyStats());

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
			refresh();
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
		refresh,
	};
}
