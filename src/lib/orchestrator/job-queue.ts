import { offlineDB } from "@/lib/db/offline";
import { QueueCore } from "@/lib/queue/core";
import { safeJsonStringify } from "@/lib/shared/json";
import type { EnqueueOptions, JobRecord, JobType } from "./types";

const DEFAULT_MAX_RETRIES: Record<JobType, number> = {
	"appwrite-sync": 3,
	"analytics-sync": 1,
	"spaced-rep-update": 2,
	"progress-update": 2,
	"competency-update": 2,
	"visual-generation": 2,
};

const DEFAULT_PRIORITY: Record<JobType, number> = {
	"appwrite-sync": 70,
	"analytics-sync": 30,
	"spaced-rep-update": 50,
	"progress-update": 50,
	"competency-update": 60,
	"visual-generation": 40,
};

export const queueCore = new QueueCore<JobRecord>(offlineDB.jobs);

export async function enqueue(
	type: JobType,
	payload: unknown,
	opts?: EnqueueOptions,
): Promise<number> {
	const now = Date.now();
	return queueCore.enqueue({
		type,
		payload: safeJsonStringify(payload),
		status: "pending",
		priority: opts?.priority ?? DEFAULT_PRIORITY[type],
		attempts: 0,
		maxRetries: DEFAULT_MAX_RETRIES[type],
		scheduledAt: opts?.scheduledAt ?? now,
		createdAt: now,
	});
}
