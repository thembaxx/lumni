import { dexieDataAccess } from "@/lib/db";
import { QueueCore } from "@/lib/queue/core";
import { safeJsonStringify } from "@/lib/shared/json";
import type {
	EnqueueOptions,
	JobPayloadByType,
	JobRecord,
	JobType,
} from "./types";

const DEFAULT_MAX_RETRIES: Record<JobType, number> = {
	"appwrite-sync": 3,
	"analytics-sync": 1,
	"spaced-rep-update": 2,
	"progress-update": 2,
	"visual-generation": 2,
	"appwrite-progress-sync": 3,
	"appwrite-attempt-sync": 3,
	"appwrite-competency-sync": 3,
	"appwrite-flashcard-sync": 3,
	"appwrite-flashcard-pull": 2,
	"appwrite-flashcard-delete": 3,
	"appwrite-wrong-answer-sync": 3,
	"appwrite-bookmark-sync": 3,
	"appwrite-bookmark-delete": 3,
	"appwrite-chat-sync": 2,
	"appwrite-rating-sync": 3,
	"appwrite-study-plan-sync": 3,
	"appwrite-question-flag": 3,
	"question-regen": 2,
	"appwrite-exam-dates-sync": 3,
	"appwrite-consent-sync": 3,
	"appwrite-shared-question-sync": 3,
	"appwrite-visual-sync": 3,
	"prune-stale-questions": 1,
};

const DEFAULT_PRIORITY: Record<JobType, number> = {
	"appwrite-sync": 70,
	"analytics-sync": 30,
	"spaced-rep-update": 50,
	"progress-update": 50,
	"visual-generation": 40,
	"appwrite-progress-sync": 65,
	"appwrite-attempt-sync": 65,
	"appwrite-competency-sync": 65,
	"appwrite-flashcard-sync": 65,
	"appwrite-flashcard-pull": 40,
	"appwrite-flashcard-delete": 65,
	"appwrite-wrong-answer-sync": 65,
	"appwrite-bookmark-sync": 65,
	"appwrite-bookmark-delete": 65,
	"appwrite-chat-sync": 50,
	"appwrite-rating-sync": 50,
	"appwrite-study-plan-sync": 60,
	"appwrite-question-flag": 50,
	"question-regen": 40,
	"appwrite-exam-dates-sync": 60,
	"appwrite-consent-sync": 65,
	"appwrite-shared-question-sync": 60,
	"appwrite-visual-sync": 50,
	"prune-stale-questions": 10,
};

export const queueCore = new QueueCore<JobRecord>(dexieDataAccess.jobs);

export async function enqueue<T extends JobType>(
	type: T,
	payload: JobPayloadByType[T],
	opts?: EnqueueOptions,
): Promise<number> {
	if (typeof indexedDB === "undefined") {
		return -1;
	}
	const now = Date.now();
	try {
		return await queueCore.enqueue({
			type,
			payload: safeJsonStringify(payload),
			status: "pending",
			priority: opts?.priority ?? DEFAULT_PRIORITY[type],
			attempts: 0,
			maxRetries: DEFAULT_MAX_RETRIES[type],
			scheduledAt: opts?.scheduledAt ?? now,
			createdAt: now,
		});
	} catch (err) {
		console.warn(`[enqueue] Failed to enqueue ${type}:`, err);
		return -1;
	}
}
