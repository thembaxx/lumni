import Dexie, { type Table } from "dexie";

export interface CachedQuestion {
	id?: number;
	subject: string;
	topic?: string;
	questions: string; // JSON stringified QAQuestion[]
	cachedAt: number;
}

export interface CachedProgress {
	id?: number;
	odSubjectId: string;
	userId?: string;
	questionsAttempted: number;
	correctCount: number;
	currentStreak: number;
	longestStreak: number;
	updatedAt: number;
}

export interface QuizAttempt {
	id?: number;
	odSubject: string;
	userId?: string;
	answers: string; // JSON stringified answers
	score: number;
	totalQuestions: number;
	duration: number;
	completedAt: number;
}

export interface SyncQueueItem {
	id?: number;
	action: "createProgress" | "updateProgress" | "createAttempt" | "sync";
	payload: string; // JSON stringified payload
	status: "pending" | "syncing" | "failed";
	attempts: number;
	maxRetries: number;
	lastError?: string;
	createdAt: number;
	updatedAt: number;
}

export interface CachedSubject {
	id?: number;
	code: string;
	name: string;
	category: string;
	data: string; // JSON stringified subject data
	cachedAt: number;
}

export class LumniOfflineDB extends Dexie {
	questions!: Table<CachedQuestion, number>;
	progress!: Table<CachedProgress, number>;
	quizAttempts!: Table<QuizAttempt, number>;
	syncQueue!: Table<SyncQueueItem, number>;
	subjects!: Table<CachedSubject, number>;

	constructor() {
		super("lumni-offline");

		this.version(1).stores({
			questions: "++id, &subject, topic, cachedAt",
			progress: "++id, &odSubjectId, userId, updatedAt",
			quizAttempts: "++id, &odSubject, userId, completedAt",
			syncQueue: "++id, status, createdAt",
			subjects: "++id, &code, cachedAt",
		});
	}
}

export const offlineDB = new LumniOfflineDB();

export async function cacheQuestions(
	subject: string,
	questions: unknown[],
	topic?: string,
): Promise<number> {
	const key = topic ? `${subject}-${topic}` : subject;
	const existing = await offlineDB.questions
		.where("subject")
		.equals(key)
		.first();

	if (existing) {
		return offlineDB.questions.update(existing.id!, {
			questions: JSON.stringify(questions),
			cachedAt: Date.now(),
		});
	}

	return offlineDB.questions.add({
		subject: key,
		topic,
		questions: JSON.stringify(questions),
		cachedAt: Date.now(),
	});
}

export async function getCachedQuestions(
	subject: string,
	topic?: string,
): Promise<unknown[] | undefined> {
	const key = topic ? `${subject}-${topic}` : subject;
	const cached = await offlineDB.questions.where("subject").equals(key).first();

	if (!cached) return undefined;

	// Expire after 24 hours
	if (Date.now() - cached.cachedAt > 24 * 60 * 60 * 1000) {
		return undefined;
	}

	return JSON.parse(cached.questions);
}

export async function saveProgress(
	odSubjectId: string,
	data: {
		questionsAttempted: number;
		correctCount: number;
		currentStreak: number;
		longestStreak: number;
	},
	userId?: string,
): Promise<number> {
	const existing = await offlineDB.progress
		.where("odSubjectId")
		.equals(odSubjectId)
		.first();

	if (existing) {
		return offlineDB.progress.update(existing.id!, {
			...data,
			updatedAt: Date.now(),
		});
	}

	return offlineDB.progress.add({
		odSubjectId,
		userId,
		...data,
		updatedAt: Date.now(),
	});
}

export async function getProgress(
	odSubjectId: string,
): Promise<CachedProgress | undefined> {
	return offlineDB.progress.where("odSubjectId").equals(odSubjectId).first();
}

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
		answers: JSON.stringify(data.answers),
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

export async function addToSyncQueue(
	action: SyncQueueItem["action"],
	payload: unknown,
): Promise<number> {
	return offlineDB.syncQueue.add({
		action,
		payload: JSON.stringify(payload),
		status: "pending",
		attempts: 0,
		maxRetries: 3,
		createdAt: Date.now(),
		updatedAt: Date.now(),
	});
}

export async function getPendingSyncItems(): Promise<SyncQueueItem[]> {
	return offlineDB.syncQueue.where("status").equals("pending").toArray();
}

export async function getAllSyncItems(): Promise<SyncQueueItem[]> {
	return offlineDB.syncQueue.orderBy("createdAt").toArray();
}

export async function updateSyncItem(
	id: number,
	updates: Partial<SyncQueueItem>,
): Promise<number> {
	return offlineDB.syncQueue.update(id, {
		...updates,
		updatedAt: Date.now(),
	});
}

export async function removeSyncItem(id: number): Promise<void> {
	return offlineDB.syncQueue.delete(id);
}

export async function clearSyncQueue(): Promise<void> {
	await offlineDB.syncQueue.where("status").equals("pending").delete();
}
