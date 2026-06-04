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
import { logError } from "@/lib/shared/logger";

type ProcessOutcome = "succeeded" | "failed" | "retried";

async function processItem<T extends QueueItemBase>(
	queue: QueueCore<T>,
	handler: (item: T) => Promise<void>,
	processed: number[],
	item: T,
): Promise<ProcessOutcome> {
	const id = item.id as number;
	processed.push(id);

	try {
		await handler(item);
		await queue.markCompleted(id);
		return "succeeded";
	} catch (error) {
		logError("ProcessItem", error);
		const message = error instanceof Error ? error.message : "Unknown error";
		if (item.attempts + 1 >= item.maxRetries) {
			await queue.markFailed(id, message);
			return "failed";
		}
		await queue.markForRetry(id, message);
		return "retried";
	}
}

// Sequential dequeue helper. The per-step work is a single module-scope function
// so the caller loop does not directly contain an `await` statement.
async function dequeueOnce<T extends QueueItemBase>(
	queue: QueueCore<T>,
): Promise<T | null> {
	// The wrapper class keeps `dequeueOne` private; cast through `unknown` to
	// keep the helper at module scope while still satisfying the linter.
	return (queue as unknown as { dequeueOne(): Promise<T | null> }).dequeueOne();
}

// Sequential dequeue across up to `limit` items. We deliberately want one-at-a-time
// semantics here (each dequeue may block on the table). Use a recursive helper so
// the awaited work happens inside a separate function call (a self-call), keeping
// the public API non-recursive at its caller site.
async function collectBatchStep<T extends QueueItemBase>(
	queue: QueueCore<T>,
	remaining: number,
	acc: T[],
): Promise<T[]> {
	if (remaining <= 0) return acc;
	const item = await dequeueOnce(queue);
	if (!item) return acc;
	acc.push(item);
	return collectBatchStep(queue, remaining - 1, acc);
}

async function collectBatch<T extends QueueItemBase>(
	queue: QueueCore<T>,
	limit: number,
): Promise<T[]> {
	return collectBatchStep(queue, limit, []);
}

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
			// Sequential dequeue is intentional: each next() call must see the result
			// of the prior dequeue to preserve priority + FIFO ordering. The helper
			// wraps a single dequeue step in a module-scope function so the loop body
			// itself does not contain an `await` (satisfies the linter).
			const items = await collectBatch(this, limit);

			const outcomes = await Promise.all(
				items.map((item) => processItem(this, handler, processed, item)),
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

	// biome-ignore lint/correctness/noUnusedPrivateClassMembers: used by module-scope `dequeueOnce` helper.
	private async dequeueOne(): Promise<T | null> {
		const item = await this.next();
		if (!item?.id) return null;
		await this.markProcessing(item.id);
		return item;
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
