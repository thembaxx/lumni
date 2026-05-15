import { Query } from "appwrite";
import {
	COLLECTIONS,
	createDocument,
	listDocuments,
	updateDocument,
} from "@/lib/db/client";
import { addToSyncQueue, offlineDB } from "@/lib/db/offline";

interface ProgressPayload {
	userId: string;
	subjectId: string;
	questionsAttempted: number;
	correctCount: number;
	currentStreak: number;
	longestStreak: number;
}

interface AttemptPayload {
	userId: string;
	subjectId: string;
	score: number;
	totalQuestions: number;
	duration: number;
	completedAt: number;
}

interface CompetencyPayload {
	type: "competency";
	subjectId: string;
	topicId: string;
	bloomLevel: string;
	proficiency: number;
	attempts: number;
	lastAssessed: number;
	level: string;
}

async function syncProgress(payload: ProgressPayload): Promise<void> {
	const existing = await listDocuments<Record<string, unknown>>(
		COLLECTIONS.USER_PROGRESS,
		[
			Query.equal("userId", payload.userId),
			Query.equal("subjectId", payload.subjectId),
		],
	);

	const now = new Date().toISOString();

	if (existing.length > 0) {
		const doc = existing[0];
		const currentAttempted = (doc.questionsAttempted as number) || 0;
		const currentCorrect = (doc.correctCount as number) || 0;
		const longestStreak = (doc.longestStreak as number) || 0;

		await updateDocument(COLLECTIONS.USER_PROGRESS, doc.$id as string, {
			questionsAttempted: currentAttempted + payload.questionsAttempted,
			correctCount: currentCorrect + payload.correctCount,
			currentStreak: payload.currentStreak,
			longestStreak: Math.max(longestStreak, payload.longestStreak),
			updatedAt: now,
		});
	} else {
		await createDocument(COLLECTIONS.USER_PROGRESS, {
			userId: payload.userId,
			subjectId: payload.subjectId,
			questionsAttempted: payload.questionsAttempted,
			correctCount: payload.correctCount,
			currentStreak: payload.currentStreak,
			longestStreak: payload.longestStreak,
			createdAt: now,
			updatedAt: now,
		});
	}
}

async function syncAttempt(payload: AttemptPayload): Promise<void> {
	await createDocument(COLLECTIONS.STUDY_SESSIONS, {
		userId: payload.userId,
		subjectId: payload.subjectId,
		questionsAnswered: payload.totalQuestions,
		correctCount: payload.score,
		duration: payload.duration,
		startedAt: new Date(
			payload.completedAt - payload.duration * 1000,
		).toISOString(),
		endedAt: new Date(payload.completedAt).toISOString(),
	});
}

async function syncCompetency(payload: CompetencyPayload): Promise<void> {
	const existing = await listDocuments<Record<string, unknown>>(
		COLLECTIONS.COMPETENCIES,
		[
			Query.equal("subjectId", payload.subjectId),
			Query.equal("topicId", payload.topicId),
			Query.equal("bloomLevel", payload.bloomLevel),
		],
	);

	const now = new Date().toISOString();

	if (existing.length > 0) {
		await updateDocument(COLLECTIONS.COMPETENCIES, existing[0].$id as string, {
			proficiency: payload.proficiency,
			attempts: payload.attempts,
			level: payload.level,
			lastAssessed: payload.lastAssessed,
			updatedAt: now,
		});
	} else {
		await createDocument(COLLECTIONS.COMPETENCIES, {
			subjectId: payload.subjectId,
			topicId: payload.topicId,
			bloomLevel: payload.bloomLevel,
			proficiency: payload.proficiency,
			attempts: payload.attempts,
			level: payload.level,
			lastAssessed: payload.lastAssessed,
			createdAt: now,
			updatedAt: now,
		});
	}
}

export async function handleSync(
	action: string,
	payload: unknown,
): Promise<void> {
	switch (action) {
		case "createProgress":
		case "updateProgress":
			await syncProgress(payload as ProgressPayload);
			break;

		case "createAttempt":
			await syncAttempt(payload as AttemptPayload);
			break;

		case "sync": {
			const data = payload as CompetencyPayload;
			if (data.type === "competency") {
				await syncCompetency(data);
			}
			break;
		}

		default:
			console.warn(`[Sync] Unknown action: ${action}`);
	}
}

export async function queueProgressSync(
	userId: string,
	subjectId: string,
	stats: {
		questionsAttempted: number;
		correctCount: number;
		currentStreak: number;
		longestStreak: number;
	},
): Promise<void> {
	await addToSyncQueue("updateProgress", {
		userId,
		subjectId,
		...stats,
	});
}

export async function queueAttemptSync(
	userId: string,
	subjectId: string,
	attempt: {
		score: number;
		totalQuestions: number;
		duration: number;
		completedAt: number;
	},
): Promise<void> {
	await addToSyncQueue("createAttempt", {
		userId,
		subjectId,
		...attempt,
	});
}

export async function queueCompetencySync(payload: {
	subjectId: string;
	topicId: string;
	bloomLevel: string;
	proficiency: number;
	attempts: number;
	level: string;
	lastAssessed: number;
}): Promise<void> {
	await addToSyncQueue("sync", {
		type: "competency",
		...payload,
	});
}

export async function flushOfflineData(userId: string): Promise<void> {
	const allProgress = await offlineDB.progress.toArray();
	for (const p of allProgress) {
		if (p.odSubjectId && (p.questionsAttempted > 0 || p.correctCount > 0)) {
			await addToSyncQueue("updateProgress", {
				userId,
				subjectId: p.odSubjectId,
				questionsAttempted: p.questionsAttempted,
				correctCount: p.correctCount,
				currentStreak: p.currentStreak,
				longestStreak: p.longestStreak,
			});
		}
		await offlineDB.progress.delete(p.id!);
	}

	const allAttempts = await offlineDB.quizAttempts.toArray();
	for (const a of allAttempts) {
		if (!a.userId) {
			await addToSyncQueue("createAttempt", {
				userId,
				subjectId: a.odSubject,
				score: a.score,
				totalQuestions: a.totalQuestions,
				duration: a.duration,
				completedAt: a.completedAt,
			});
			await offlineDB.quizAttempts.update(a.id!, { userId });
		}
	}
}
