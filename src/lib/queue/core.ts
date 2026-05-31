export interface QueueItemBase {
	id?: number;
	type: string;
	payload: string;
	status: "pending" | "processing" | "completed" | "failed" | "cancelled";
	priority: number;
	attempts: number;
	maxRetries: number;
	scheduledAt: number;
	createdAt: number;
	startedAt?: number;
	completedAt?: number;
	lastError?: string;
}

export interface ProcessResult {
	processed: number;
	succeeded: number;
	failed: number;
}

export interface QueueTable<T extends QueueItemBase> {
	add(item: Omit<T, "id">): Promise<number>;
	get(id: number): Promise<T | undefined>;
	update(id: number, changes: Partial<T>): Promise<number>;
	where(index: string): {
		equals(value: string): {
			count(): Promise<number>;
			toArray(): Promise<T[]>;
		};
	};
	toArray(): Promise<T[]>;
}

import { calculateBackoffDelay } from "@/lib/shared/backoff";

export class QueueCore<T extends QueueItemBase> {
	constructor(private table: QueueTable<T>) {}

	async enqueue(item: Omit<T, "id">): Promise<number> {
		return this.table.add(item as T);
	}

	async next(): Promise<T | null> {
		const now = Date.now();
		const items = await this.table.where("status").equals("pending").toArray();
		const available = items.filter((j) => j.scheduledAt <= now);
		if (available.length === 0) return null;
		available.sort(
			(a, b) => b.priority - a.priority || a.createdAt - b.createdAt,
		);
		return available[0];
	}

	async markProcessing(id: number): Promise<void> {
		await this.table.update(id, {
			status: "processing",
			startedAt: Date.now(),
		} as unknown as Partial<T>);
	}

	async markCompleted(id: number, summary?: string): Promise<void> {
		await this.table.update(id, {
			status: "completed",
			completedAt: Date.now(),
			resultSummary: summary,
		} as unknown as Partial<T>);
	}

	async markFailed(id: number, error: string): Promise<void> {
		await this.table.update(id, {
			status: "failed",
			lastError: error,
			completedAt: Date.now(),
		} as unknown as Partial<T>);
	}

	async markForRetry(id: number, error: string): Promise<void> {
		const item = await this.table.get(id);
		if (!item) return;
		const backoff = calculateBackoffDelay(item.attempts);
		await this.table.update(id, {
			status: "pending",
			lastError: error,
			attempts: item.attempts + 1,
			scheduledAt: Date.now() + backoff,
		} as unknown as Partial<T>);
	}

	async processBatch(
		handler: (item: T) => Promise<void>,
		limit = 5,
		concurrencyGuard: { isProcessing: boolean } = { isProcessing: false },
	): Promise<ProcessResult> {
		if (concurrencyGuard.isProcessing)
			return { processed: 0, succeeded: 0, failed: 0 };
		concurrencyGuard.isProcessing = true;

		let succeeded = 0;
		let failed = 0;
		const processed: number[] = [];

		try {
			const items: T[] = [];
			// Sequential dequeue: each next() call depends on previous items being dequeued for correct ordering (must run sequentially)
			for (let i = 0; i < limit; i++) {
				const item = await this.next();
				if (!item?.id) break;
				await this.markProcessing(item.id);
				items.push(item);
			}

			const outcomes = await Promise.all(
				items.map(async (item) => {
					const id = item.id as number;
					processed.push(id);

					try {
						await handler(item);
						await this.markCompleted(id);
						return "succeeded" as const;
					} catch (error) {
						const message =
							error instanceof Error ? error.message : "Unknown error";
						if (item.attempts + 1 >= item.maxRetries) {
							await this.markFailed(id, message);
							return "failed" as const;
						} else {
							await this.markForRetry(id, message);
							return "retried" as const;
						}
					}
				}),
			);

			for (const outcome of outcomes) {
				if (outcome === "succeeded") succeeded++;
				else if (outcome === "failed") failed++;
			}
		} finally {
			concurrencyGuard.isProcessing = false;
		}

		return { processed: processed.length, succeeded, failed };
	}

	async resetStaleProcessingItems(staleThreshold = 60000): Promise<number> {
		const now = Date.now();
		const all = await this.table.toArray();
		const stale = all.filter(
			(j) =>
				j.status === "processing" &&
				j.startedAt &&
				now - j.startedAt > staleThreshold,
		);
		await Promise.all(
			stale.flatMap((item) =>
				item.id
					? [
							this.table.update(item.id, {
								status: "pending",
								attempts: item.attempts + 1,
							} as unknown as Partial<T>),
						]
					: [],
			),
		);
		return stale.length;
	}

	async getPendingCount(): Promise<number> {
		return this.table.where("status").equals("pending").count();
	}

	async getStats(): Promise<{
		pending: number;
		processing: number;
		failed: number;
		completed: number;
	}> {
		const all = await this.table.toArray();
		const count = (status: string) =>
			all.filter((j) => j.status === status).length;
		return {
			pending: count("pending"),
			processing: count("processing"),
			failed: count("failed"),
			completed: count("completed"),
		};
	}
}
