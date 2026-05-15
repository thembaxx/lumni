import { safeJsonParse, safeJsonStringify } from "@/lib/utils/json";
import { offlineDB, type SyncQueueItem } from "../schema";

export function calculateBackoffDelay(attempts: number): number {
	const baseDelay = 1000;
	const maxDelay = 60000;
	const delay = Math.min(baseDelay * Math.pow(2, attempts), maxDelay);
	const jitter = Math.random() * 1000;
	return delay + jitter;
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
		(item) =>
			JSON.stringify(safeJsonParse(item.payload)) === JSON.stringify(payload),
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

	const ready = items.filter(
		(item) => !item.retryAfter || item.retryAfter <= Date.now(),
	);
	if (ready.length === 0) return null;

	ready.sort(
		(a, b) =>
			(b.priority || 0) - (a.priority || 0) || a.createdAt - b.createdAt,
	);

	return ready[0];
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

export async function resetStaleSyncingItems(): Promise<number> {
	const stuck = await offlineDB.syncQueue
		.where("status")
		.equals("syncing")
		.toArray();

	let reset = 0;
	for (const item of stuck) {
		await offlineDB.syncQueue.update(item.id!, {
			status: "pending",
			attempts: item.attempts + 1,
			retryAfter: Date.now() + calculateBackoffDelay(item.attempts),
			updatedAt: Date.now(),
		});
		reset++;
	}

	return reset;
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
