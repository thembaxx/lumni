"use client";

import { useCallback, useEffect } from "react";
import {
	addToSyncQueue,
	getPendingSyncItems,
	removeSyncItem,
	resetStaleSyncingItems,
	type SyncQueueItem,
	updateSyncItem,
} from "@/lib/db/offline";

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

let isProcessing = false;

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
	if (isProcessing) return;
	if (typeof navigator !== "undefined" && !navigator.onLine) return;

	isProcessing = true;

	try {
		await resetStaleSyncingItems();
		const pendingItems = await getPendingSyncItems();

		for (const item of pendingItems) {
			try {
				await updateSyncItem(item.id!, {
					status: "syncing",
					attempts: item.attempts + 1,
				});

				if (syncConfig.onSync) {
					await syncConfig.onSync(item.action, JSON.parse(item.payload));
				}

				await removeSyncItem(item.id!);
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : "Unknown error";

				if (item.attempts + 1 >= (item.maxRetries || syncConfig.maxRetries!)) {
					await updateSyncItem(item.id!, {
						status: "failed",
						lastError: errorMessage,
					});
				} else {
					await updateSyncItem(item.id!, {
						status: "pending",
						lastError: errorMessage,
					});
				}
			}
		}
	} finally {
		isProcessing = false;
	}
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
			console.log("[Sync] Network online, processing queue...");
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
