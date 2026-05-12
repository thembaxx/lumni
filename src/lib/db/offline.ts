import Dexie, { type Table } from "dexie";
import type { CompetencyRecord } from "@/lib/competency-engine/types";
import type { JobRecord } from "@/lib/orchestrator/types";
import { safeJsonParse, safeJsonStringify } from "@/lib/utils/json";

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
	retryAfter?: number;
	priority?: number;
}

export interface SyncConflict {
	id: number;
	localData: unknown;
	serverData: unknown;
	conflictType: "progress" | "attempt" | "preference";
	resolvedAt?: number;
	resolution?: "local" | "server" | "merged";
}

export interface CachedSubject {
	id?: number;
	code: string;
	name: string;
	category: string;
	data: string; // JSON stringified subject data
	cachedAt: number;
}

export interface QuizAnswer {
	questionId: string;
	selectedOption: string | null;
	isCorrect: boolean | null;
	answeredAt: number;
	timeSpent: number;
}

export interface QuizSessionState {
	id?: number;
	sessionId: string;
	subject: string;
	topic?: string;
	questions: string; // JSON stringified QAQuestion[]
	answers: QuizAnswer[];
	currentIndex: number;
	startedAt: number;
	lastSavedAt: number;
	isPaused: boolean;
	duration: number;
}

export class LumniOfflineDB extends Dexie {
	questions!: Table<CachedQuestion, number>;
	progress!: Table<CachedProgress, number>;
	quizAttempts!: Table<QuizAttempt, number>;
	syncQueue!: Table<SyncQueueItem, number>;
	subjects!: Table<CachedSubject, number>;
	quizSessions!: Table<QuizSessionState, number>;
	conflicts!: Table<SyncConflict, number>;
	jobs!: Table<JobRecord, number>;
	competencies!: Table<CompetencyRecord, number>;

	constructor() {
		super("lumni-offline");

		this.version(1).stores({
			questions: "++id, &subject, topic, cachedAt",
			progress: "++id, &odSubjectId, userId, updatedAt",
			quizAttempts: "++id, &odSubject, userId, completedAt",
			syncQueue: "++id, status, createdAt",
			subjects: "++id, &code, cachedAt",
		});

		this.version(2).stores({
			quizSessions: "++id, &sessionId, subject, startedAt, lastSavedAt",
		});

		this.version(3).stores({
			syncQueue: "++id, status, priority, createdAt",
			conflicts: "++id, resolvedAt",
		});

		this.version(4).stores({
			jobs: "++id, type, status, priority, scheduledAt, createdAt",
		});

		this.version(5).stores({
			competencies: "++id, subjectId, topicId, bloomLevel, level, lastAssessed",
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
			questions: safeJsonStringify(questions),
			cachedAt: Date.now(),
		});
	}

	return offlineDB.questions.add({
		subject: key,
		topic,
		questions: safeJsonStringify(questions),
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

	return safeJsonParse(cached.questions, []) as unknown[];
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

export async function addToSyncQueue(
	action: SyncQueueItem["action"],
	payload: unknown,
): Promise<number> {
	return offlineDB.syncQueue.add({
		action,
		payload: safeJsonStringify(payload),
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

export function calculateBackoffDelay(attempts: number): number {
	const baseDelay = 1000;
	const maxDelay = 60000;
	const delay = Math.min(baseDelay * Math.pow(2, attempts), maxDelay);
	const jitter = Math.random() * 1000;
	return delay + jitter;
}

export async function addToSyncQueueWithPriority(
	action: SyncQueueItem["action"],
	payload: unknown,
	priority: number = 0,
): Promise<number> {
	const existing = await offlineDB.syncQueue
		.where("status")
		.equals("pending")
		.toArray();

	const sameAction = existing.find(
		(item) => safeJsonParse(item.payload) === payload,
	);
	if (sameAction) {
		return sameAction.id!;
	}

	return offlineDB.syncQueue.add({
		action,
		payload: safeJsonStringify(payload),
		status: "pending",
		attempts: 0,
		maxRetries: 3,
		priority,
		createdAt: Date.now(),
		updatedAt: Date.now(),
	});
}

export async function getNextSyncItem(): Promise<SyncQueueItem | null> {
	const items = await offlineDB.syncQueue
		.where("status")
		.equals("pending")
		.toArray();

	if (items.length === 0) return null;

	items.sort((a, b) => {
		const aTime = a.retryAfter || 0;
		const bTime = b.retryAfter || 0;
		if (aTime > Date.now() || bTime > Date.now()) return 0;
		return (b.priority || 0) - (a.priority || 0) || a.createdAt - b.createdAt;
	});

	return items[0];
}

export async function markSyncItemSyncing(id: number): Promise<void> {
	await offlineDB.syncQueue.update(id, {
		status: "syncing",
		updatedAt: Date.now(),
	});
}

export async function markSyncItemFailed(
	id: number,
	error: string,
	attempts: number,
	maxRetries: number,
): Promise<void> {
	if (attempts >= maxRetries) {
		await offlineDB.syncQueue.update(id, {
			status: "failed",
			lastError: error,
			attempts,
			updatedAt: Date.now(),
		});
	} else {
		const retryAfter = Date.now() + calculateBackoffDelay(attempts);
		await offlineDB.syncQueue.update(id, {
			status: "pending",
			lastError: error,
			attempts,
			retryAfter,
			updatedAt: Date.now(),
		});
	}
}

export async function markSyncItemSuccess(id: number): Promise<void> {
	await offlineDB.syncQueue.delete(id);
}

export async function getSyncQueueStats(): Promise<{
	pending: number;
	syncing: number;
	failed: number;
	total: number;
}> {
	const all = await offlineDB.syncQueue.toArray();
	return {
		pending: all.filter((i) => i.status === "pending").length,
		syncing: all.filter((i) => i.status === "syncing").length,
		failed: all.filter((i) => i.status === "failed").length,
		total: all.length,
	};
}

export async function retryFailedSyncItems(): Promise<number> {
	const failed = await offlineDB.syncQueue
		.where("status")
		.equals("failed")
		.toArray();

	let retried = 0;
	for (const item of failed) {
		await offlineDB.syncQueue.update(item.id!, {
			status: "pending",
			attempts: 0,
			retryAfter: undefined,
			updatedAt: Date.now(),
		});
		retried++;
	}

	return retried;
}

export async function saveConflict(
	conflict: Omit<SyncConflict, "id" | "resolvedAt" | "resolution">,
): Promise<number> {
	return offlineDB.conflicts.add(conflict as SyncConflict);
}

export async function getUnresolvedConflicts(): Promise<SyncConflict[]> {
	return offlineDB.conflicts.filter((c) => !c.resolvedAt).toArray();
}

export async function resolveConflict(
	id: number,
	resolution: "local" | "server" | "merged",
	mergedData?: unknown,
): Promise<void> {
	await offlineDB.conflicts.update(id, {
		resolvedAt: Date.now(),
		resolution,
	});
}

export async function clearResolvedConflicts(): Promise<void> {
	await offlineDB.conflicts.filter((c) => !!c.resolvedAt).delete();
}
