import { QueueCore } from "@/lib/queue/core";
import { offlineDB } from "@/lib/db/offline";
import { safeJsonStringify } from "@/lib/shared/json";
import type {
	EnqueueOptions,
	JobRecord,
	JobStats,
	JobStatus,
	JobStatusResult,
	JobType,
} from "./types";

const DEFAULT_MAX_RETRIES: Record<JobType, number> = {
	"appwrite-sync": 3,
	"analytics-sync": 1,
	"spaced-rep-update": 2,
	"progress-update": 2,
	"competency-update": 2,
};

const DEFAULT_PRIORITY: Record<JobType, number> = {
	"appwrite-sync": 70,
	"analytics-sync": 30,
	"spaced-rep-update": 50,
	"progress-update": 50,
	"competency-update": 60,
};

export class JobQueue {
	readonly core = new QueueCore<JobRecord>(offlineDB.jobs);

	async enqueue(
		type: JobType,
		payload: unknown,
		opts?: EnqueueOptions,
	): Promise<number> {
		const now = Date.now();
		const record: Omit<JobRecord, "id"> = {
			type,
			payload: safeJsonStringify(payload),
			status: "pending",
			priority: opts?.priority ?? DEFAULT_PRIORITY[type],
			attempts: 0,
			maxRetries: DEFAULT_MAX_RETRIES[type],
			scheduledAt: opts?.scheduledAt ?? now,
			createdAt: now,
		};
		return this.core.enqueue(record);
	}

	async getStatus(jobId: number): Promise<JobStatusResult | null> {
		const job = await offlineDB.jobs.get(jobId);
		if (!job) return null;
		return { status: job.status, lastError: job.lastError };
	}

	async getStats(): Promise<JobStats> {
		return this.core.getStats();
	}

	async next(): Promise<JobRecord | null> {
		return this.core.next();
	}

	async markProcessing(id: number): Promise<void> {
		return this.core.markProcessing(id);
	}

	async markCompleted(id: number, summary?: string): Promise<void> {
		return this.core.markCompleted(id, summary);
	}

	async markFailed(id: number, error: string): Promise<void> {
		return this.core.markFailed(id, error);
	}

	async markForRetry(id: number, error: string): Promise<void> {
		return this.core.markForRetry(id, error);
	}

	async getPendingCount(): Promise<number> {
		return this.core.getPendingCount();
	}
}

export const jobQueue = new JobQueue();
