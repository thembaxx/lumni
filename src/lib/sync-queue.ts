"use client";

import { useCallback, useEffect } from "react";
import {
	addToSyncQueue,
	offlineDB,
	resetStaleSyncingItems,
	type SyncQueueItem,
} from "@/lib/db/offline";
import {
	QueueCore,
	type QueueItemBase,
	type QueueTable,
} from "@/lib/queue/core";
import { safeJsonParse } from "@/lib/shared/json";

interface SyncConfig {
	maxRetries?: number;
	onSync?: (action: string, payload: unknown) => Promise<void>;
}

let syncConfig: SyncConfig = {
	maxRetries: 3,
	onSync: undefined,
};

export function initSyncQueue(config: SyncConfig): void {
	syncConfig = { ...syncConfig, ...config };
}

type QueuedSyncItem = QueueItemBase & {
	action: SyncQueueItem["action"];
	updatedAt: number;
	retryAfter?: number;
};

function toQueuedItem(item: SyncQueueItem): QueuedSyncItem {
	return {
		id: item.id,
		type: item.action,
		payload: item.payload,
		status:
			item.status === "syncing"
				? ("processing" as const)
				: (item.status as "pending" | "failed"),
		priority: item.priority ?? 0,
		attempts: item.attempts,
		maxRetries: item.maxRetries,
		lastError: item.lastError,
		scheduledAt: item.retryAfter ?? item.createdAt,
		createdAt: item.createdAt,
		action: item.action,
		updatedAt: item.updatedAt,
		retryAfter: item.retryAfter,
	};
}

function toSyncUpdate(
	changes: Partial<QueuedSyncItem>,
): Partial<SyncQueueItem> {
	const update: Partial<SyncQueueItem> = { updatedAt: Date.now() };
	if ("status" in changes) {
		update.status =
			changes.status === "processing"
				? "syncing"
				: (changes.status as SyncQueueItem["status"]);
	}
	if ("lastError" in changes) update.lastError = changes.lastError;
	if ("attempts" in changes) update.attempts = changes.attempts;
	if ("scheduledAt" in changes) update.retryAfter = changes.scheduledAt;
	if ("priority" in changes) update.priority = changes.priority;
	return update;
}

const syncQueueTable: QueueTable<QueuedSyncItem> = {
	add: async () => {
		throw new Error("Use addToSyncQueue instead of core.enqueue");
	},
	get: async (id) => {
		const item = await offlineDB.syncQueue.get(id);
		if (!item) return undefined;
		return toQueuedItem(item);
	},
	update: async (id, changes) => {
		if ("status" in changes && changes.status === "completed") {
			await offlineDB.syncQueue.delete(id);
			return 1;
		}
		return offlineDB.syncQueue.update(id, toSyncUpdate(changes));
	},
	where: (_index) => ({
		equals: (_value) => ({
			count: async () => {
				const all = await offlineDB.syncQueue.toArray();
				return all.filter((i) => i.status === "pending").length;
			},
			toArray: async () => {
				const all = await offlineDB.syncQueue.toArray();
				return all.filter((i) => i.status === "pending").map(toQueuedItem);
			},
		}),
	}),
	toArray: async () => {
		const items = await offlineDB.syncQueue.toArray();
		return items.map(toQueuedItem);
	},
};

const core = new QueueCore<QueuedSyncItem>(syncQueueTable);

const guard = { isProcessing: false };

export async function queueAction(
	action: SyncQueueItem["action"],
	payload: unknown,
): Promise<void> {
	await addToSyncQueue(action, payload);

	if (typeof navigator !== "undefined" && navigator.onLine) {
		processQueue();
	}
}

export async function processQueue(): Promise<void> {
	if (typeof navigator !== "undefined" && !navigator.onLine) return;

	await resetStaleSyncingItems();

	await core.processBatch(
		async (item) => {
			if (syncConfig.onSync) {
				await syncConfig.onSync(item.action, safeJsonParse(item.payload));
			}
		},
		1,
		guard,
	);
}

export function useSyncQueue() {
	const process = useCallback(() => {
		processQueue();
	}, []);

	return {
		queueAction,
		processQueue: process,
	};
}

export function useAutoSync() {
	const { processQueue } = useSyncQueue();

	useEffect(() => {
		if (typeof window === "undefined") return;

		const handleOnline = () => {
			processQueue();
		};

		window.addEventListener("online", handleOnline);

		if (navigator.onLine) {
			processQueue();
		}

		return () => {
			window.removeEventListener("online", handleOnline);
		};
	}, [processQueue]);

	return null;
}
