import { dexieDataAccess } from "@/lib/db";
import { safeJsonStringify } from "@/lib/shared/json";
import type { QuizAttempt, QuizSessionState } from "../schema";

export async function saveQuizAttempt(
	odSubject: string,
	data: {
		answers: unknown[];
		score: number;
		maxScore?: number;
		totalQuestions: number;
		duration: number;
	},
	userId?: string,
): Promise<number> {
	return dexieDataAccess.quizAttempts.add({
		odSubject,
		userId,
		answers: safeJsonStringify(data.answers),
		score: data.score,
		maxScore: data.maxScore,
		totalQuestions: data.totalQuestions,
		duration: data.duration,
		completedAt: Date.now(),
	});
}

export async function getQuizAttempts(
	odSubject: string,
	limit = 10,
): Promise<QuizAttempt[]> {
	return dexieDataAccess.quizAttempts
		.where("odSubject")
		.equals(odSubject)
		.reverse()
		.limit(limit)
		.toArray();
}

export async function saveQuizSession(
	session: Omit<QuizSessionState, "id" | "lastSavedAt">,
): Promise<number> {
	const existing = await dexieDataAccess.quizSessions
		.where("sessionId")
		.equals(session.sessionId)
		.first();

	if (existing) {
		return dexieDataAccess.quizSessions.update(existing.id ?? 0, {
			...session,
			lastSavedAt: Date.now(),
		});
	}

	return dexieDataAccess.quizSessions.add({
		...session,
		lastSavedAt: Date.now(),
	});
}

export async function getQuizSession(
	sessionId: string,
): Promise<QuizSessionState | undefined> {
	return dexieDataAccess.quizSessions
		.where("sessionId")
		.equals(sessionId)
		.first();
}

export async function getActiveQuizSession(
	subject: string,
): Promise<QuizSessionState | undefined> {
	const sessions = await dexieDataAccess.quizSessions
		.where("subject")
		.equals(subject)
		.toArray();

	const active = sessions.find((s) => !s.isPaused);
	if (active) return active;

	return sessions.reduce((a, b) => (a.lastSavedAt > b.lastSavedAt ? a : b));
}

export async function getAllPausedSessions(): Promise<QuizSessionState[]> {
	const all = await dexieDataAccess.quizSessions.toArray();
	return all.filter((s) => s.isPaused);
}

export async function resumeQuizSession(
	sessionId: string,
): Promise<QuizSessionState | undefined> {
	const session = await getQuizSession(sessionId);
	if (!session) return undefined;

	await dexieDataAccess.quizSessions.update(session.id ?? 0, {
		isPaused: false,
		lastSavedAt: Date.now(),
	});

	return { ...session, isPaused: false };
}

export async function pauseQuizSession(sessionId: string): Promise<void> {
	const session = await getQuizSession(sessionId);
	if (!session) return;

	await dexieDataAccess.quizSessions.update(session.id ?? 0, {
		isPaused: true,
		lastSavedAt: Date.now(),
	});
}

export async function deleteQuizSession(sessionId: string): Promise<void> {
	await dexieDataAccess.quizSessions
		.where("sessionId")
		.equals(sessionId)
		.delete();
}

export async function clearOldQuizSessions(maxAgeHours = 24): Promise<void> {
	const cutoff = Date.now() - maxAgeHours * 60 * 60 * 1000;
	await dexieDataAccess.quizSessions
		.where("lastSavedAt")
		.below(cutoff)
		.delete();
}
