import { safeJsonStringify } from "@/lib/shared/json";
import { offlineDB, type QuizAttempt, type QuizSessionState } from "../schema";

export async function saveQuizAttempt(
	odSubject: string,
	data: {
		answers: unknown[];
		score: number;
		totalQuestions: number;
		duration: number;
	},
	userId?: string,
): Promise<number> {
	return offlineDB.quizAttempts.add({
		odSubject,
		userId,
		answers: safeJsonStringify(data.answers),
		score: data.score,
		totalQuestions: data.totalQuestions,
		duration: data.duration,
		completedAt: Date.now(),
	});
}

export async function getQuizAttempts(
	odSubject: string,
	limit = 10,
): Promise<QuizAttempt[]> {
	return offlineDB.quizAttempts
		.where("odSubject")
		.equals(odSubject)
		.reverse()
		.limit(limit)
		.toArray();
}

export async function saveQuizSession(
	session: Omit<QuizSessionState, "id" | "lastSavedAt">,
): Promise<number> {
	const existing = await offlineDB.quizSessions
		.where("sessionId")
		.equals(session.sessionId)
		.first();

	if (existing) {
		return offlineDB.quizSessions.update(existing.id!, {
			...session,
			lastSavedAt: Date.now(),
		});
	}

	return offlineDB.quizSessions.add({
		...session,
		lastSavedAt: Date.now(),
	});
}

export async function getQuizSession(
	sessionId: string,
): Promise<QuizSessionState | undefined> {
	return offlineDB.quizSessions.where("sessionId").equals(sessionId).first();
}

export async function getActiveQuizSession(
	subject: string,
): Promise<QuizSessionState | undefined> {
	const sessions = await offlineDB.quizSessions
		.where("subject")
		.equals(subject)
		.toArray();

	const active = sessions.find((s) => !s.isPaused);
	if (active) return active;

	return sessions.sort((a, b) => b.lastSavedAt - a.lastSavedAt)[0];
}

export async function getAllPausedSessions(): Promise<QuizSessionState[]> {
	return offlineDB.quizSessions.filter((s) => s.isPaused).toArray();
}

export async function resumeQuizSession(
	sessionId: string,
): Promise<QuizSessionState | undefined> {
	const session = await getQuizSession(sessionId);
	if (!session) return undefined;

	await offlineDB.quizSessions.update(session.id!, {
		isPaused: false,
		lastSavedAt: Date.now(),
	});

	return { ...session, isPaused: false };
}

export async function pauseQuizSession(sessionId: string): Promise<void> {
	const session = await getQuizSession(sessionId);
	if (!session) return;

	await offlineDB.quizSessions.update(session.id!, {
		isPaused: true,
		lastSavedAt: Date.now(),
	});
}

export async function deleteQuizSession(sessionId: string): Promise<void> {
	await offlineDB.quizSessions.where("sessionId").equals(sessionId).delete();
}

export async function clearOldQuizSessions(maxAgeHours = 24): Promise<void> {
	const cutoff = Date.now() - maxAgeHours * 60 * 60 * 1000;
	await offlineDB.quizSessions.where("lastSavedAt").below(cutoff).delete();
}
