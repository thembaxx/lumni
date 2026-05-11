import { loadFromStorage, saveToStorage } from "./storage";

export interface StudySession {
	id: string;
	subject: string;
	topic?: string;
	type: "quiz" | "flashcard" | "exam" | "review";
	scheduledAt: number;
	duration: number;
	completed: boolean;
	completedAt?: number;
	notes?: string;
	repeat?: "daily" | "weekly" | "none";
}

export interface ExamDate {
	id: string;
	subject: string;
	paper: string;
	date: number;
	daysUntil: number;
	notes?: string;
}

export interface StudyPlan {
	sessions: StudySession[];
	examDates: ExamDate[];
	generatedAt: number;
}

const STUDY_PLAN_KEY = "lumni_study_plan";

export function loadStudyPlan(): StudyPlan {
	return loadFromStorage<StudyPlan>(STUDY_PLAN_KEY, {
		sessions: [],
		examDates: [],
		generatedAt: 0,
	});
}

export function saveStudyPlan(plan: StudyPlan): void {
	saveToStorage(STUDY_PLAN_KEY, plan);
}

export function addStudySession(session: Omit<StudySession, "id">): StudyPlan {
	const plan = loadStudyPlan();
	const newSession: StudySession = {
		...session,
		id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
	};
	plan.sessions.push(newSession);
	plan.generatedAt = Date.now();
	saveStudyPlan(plan);
	return plan;
}

export function updateStudySession(
	id: string,
	updates: Partial<StudySession>,
): StudyPlan {
	const plan = loadStudyPlan();
	const index = plan.sessions.findIndex((s) => s.id === id);
	if (index >= 0) {
		plan.sessions[index] = { ...plan.sessions[index], ...updates };
		plan.generatedAt = Date.now();
		saveStudyPlan(plan);
	}
	return plan;
}

export function deleteStudySession(id: string): StudyPlan {
	const plan = loadStudyPlan();
	plan.sessions = plan.sessions.filter((s) => s.id !== id);
	plan.generatedAt = Date.now();
	saveStudyPlan(plan);
	return plan;
}

export function addExamDate(
	exam: Omit<ExamDate, "id" | "daysUntil">,
): StudyPlan {
	const plan = loadStudyPlan();
	const daysUntil = Math.ceil((exam.date - Date.now()) / (1000 * 60 * 60 * 24));
	const newExam: ExamDate = {
		...exam,
		id: `exam_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
		daysUntil: Math.max(0, daysUntil),
	};
	plan.examDates.push(newExam);
	plan.generatedAt = Date.now();
	saveStudyPlan(plan);
	return plan;
}

export function deleteExamDate(id: string): StudyPlan {
	const plan = loadStudyPlan();
	plan.examDates = plan.examDates.filter((e) => e.id !== id);
	plan.generatedAt = Date.now();
	saveStudyPlan(plan);
	return plan;
}

export function getUpcomingSessions(days: number = 7): StudySession[] {
	const plan = loadStudyPlan();
	const cutoff = Date.now() + days * 24 * 60 * 60 * 1000;
	return plan.sessions
		.filter((s) => s.scheduledAt <= cutoff && !s.completed)
		.sort((a, b) => a.scheduledAt - b.scheduledAt);
}

export function getUpcomingExams(): ExamDate[] {
	const plan = loadStudyPlan();
	return plan.examDates
		.filter((e) => e.daysUntil >= 0)
		.sort((a, b) => a.date - b.date);
}

export function getTodaySessions(): StudySession[] {
	const plan = loadStudyPlan();
	const today = new Date();
	const startOfDay = new Date(
		today.getFullYear(),
		today.getMonth(),
		today.getDate(),
	).getTime();
	const endOfDay = startOfDay + 24 * 60 * 60 * 1000;

	return plan.sessions.filter(
		(s) => s.scheduledAt >= startOfDay && s.scheduledAt < endOfDay,
	);
}

export function autoScheduleSessions(
	subjects: string[],
	weakTopics: Record<string, string[]>,
	dailyGoalMinutes: number = 30,
): StudyPlan {
	const plan = loadStudyPlan();
	const now = Date.now();
	const sessions: StudySession[] = [];

	subjects.forEach((subject) => {
		const topics = weakTopics[subject] || [];
		if (topics.length === 0) return;

		const sessionDuration = Math.min(dailyGoalMinutes / subjects.length, 45);
		let dayOffset = 0;

		topics.slice(0, 3).forEach((topic) => {
			const scheduledAt = now + dayOffset * 24 * 60 * 60 * 1000;
			sessions.push({
				id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
				subject,
				topic,
				type: "quiz",
				scheduledAt,
				duration: Math.round(sessionDuration),
				completed: false,
			});
			dayOffset++;
		});
	});

	plan.sessions = [...plan.sessions, ...sessions];
	plan.generatedAt = Date.now();
	saveStudyPlan(plan);

	return plan;
}

export function getStudyStats(): {
	totalSessions: number;
	completedSessions: number;
	upcomingSessions: number;
	studyTimeMinutes: number;
	examCount: number;
	daysUntilNextExam: number | null;
} {
	const plan = loadStudyPlan();

	const completed = plan.sessions.filter((s) => s.completed);
	const now = Date.now();
	const upcoming = plan.sessions.filter(
		(s) => !s.completed && s.scheduledAt >= now,
	);
	const upcomingExams = plan.examDates
		.filter((e) => e.daysUntil > 0)
		.sort((a, b) => a.date - b.date);

	return {
		totalSessions: plan.sessions.length,
		completedSessions: completed.length,
		upcomingSessions: upcoming.length,
		studyTimeMinutes: completed.reduce((sum, s) => sum + s.duration, 0),
		examCount: plan.examDates.length,
		daysUntilNextExam: upcomingExams[0]?.daysUntil || null,
	};
}
