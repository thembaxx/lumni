import { offlineDB } from "@/lib/db/offline";
import { safeJsonStringify } from "@/lib/utils/json";
import type {
	EnqueueOptions,
	JobRecord,
	JobStats,
	JobStatus,
	JobStatusResult,
	JobType,
} from "./types";

const DEFAULT_MAX_RETRIES: Record<JobType, number> = {
	"visual-pre-cache": 2,
	"appwrite-sync": 3,
	"analytics-sync": 1,
	"spaced-rep-update": 2,
	"progress-update": 2,
	"competency-update": 2,
};

const DEFAULT_PRIORITY: Record<JobType, number> = {
	"visual-pre-cache": 60,
	"appwrite-sync": 70,
	"analytics-sync": 30,
	"spaced-rep-update": 50,
	"progress-update": 50,
	"competency-update": 60,
};

export class JobQueue {
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
		return offlineDB.jobs.add(record as JobRecord);
	}

	async getStatus(jobId: number): Promise<JobStatusResult | null> {
		const job = await offlineDB.jobs.get(jobId);
		if (!job) return null;
		return { status: job.status, lastError: job.lastError };
	}

	async getStats(): Promise<JobStats> {
		const all = await offlineDB.jobs.toArray();
		const count = (status: JobStatus) =>
			all.filter((j) => j.status === status).length;
		return {
			pending: count("pending"),
			processing: count("processing"),
			failed: count("failed"),
			completed: count("completed"),
		};
	}

	async next(): Promise<JobRecord | null> {
		const now = Date.now();
		const items = await offlineDB.jobs
			.where("status")
			.equals("pending")
			.filter((j) => j.scheduledAt <= now)
			.toArray();

		if (items.length === 0) return null;

		items.sort((a, b) => b.priority - a.priority || a.createdAt - b.createdAt);
		return items[0];
	}

	async markProcessing(id: number): Promise<void> {
		await offlineDB.jobs.update(id, {
			status: "processing",
			startedAt: Date.now(),
		});
	}

	async markCompleted(id: number, summary?: string): Promise<void> {
		await offlineDB.jobs.update(id, {
			status: "completed",
			completedAt: Date.now(),
			resultSummary: summary,
		});
	}

	async markFailed(id: number, error: string): Promise<void> {
		await offlineDB.jobs.update(id, {
			status: "failed",
			lastError: error,
			completedAt: Date.now(),
		});
	}

	async markForRetry(id: number, error: string): Promise<void> {
		const job = await offlineDB.jobs.get(id);
		if (!job) return;

		const backoff = calculateBackoffDelay(job.attempts);

		await offlineDB.jobs.update(id, {
			status: "pending",
			lastError: error,
			attempts: job.attempts + 1,
			scheduledAt: Date.now() + backoff,
		});
	}

	async getPendingCount(): Promise<number> {
		return offlineDB.jobs.where("status").equals("pending").count();
	}
}

function calculateBackoffDelay(attempts: number): number {
	const baseDelay = 1000;
	const maxDelay = 60000;
	const delay = Math.min(baseDelay * Math.pow(2, attempts), maxDelay);
	return delay + Math.random() * 1000;
}

export const jobQueue = new JobQueue();
