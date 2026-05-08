"use client";

import { useCallback, useEffect, useState } from "react";
import {
	addToSyncQueueWithPriority,
	getNextSyncItem,
	getSyncQueueStats,
	getUnresolvedConflicts,
	markSyncItemFailed,
	markSyncItemSuccess,
	markSyncItemSyncing,
	resolveConflict,
	retryFailedSyncItems,
	type SyncConflict,
	type SyncQueueItem,
} from "@/lib/db/offline";
import { createOfflineHandler, isOnline } from "@/lib/utils/network";

export interface UseEnhancedSyncOptions {
	autoSync?: boolean;
	syncInterval?: number;
	maxRetries?: number;
	onSync?: (item: SyncQueueItem) => Promise<boolean>;
	onConflict?: (conflict: SyncConflict) => void;
}

export interface UseEnhancedSyncReturn {
	syncStats: {
		pending: number;
		syncing: number;
		failed: number;
		total: number;
	};
	syncNow: () => Promise<void>;
	retryFailed: () => Promise<number>;
	hasConflicts: boolean;
	conflicts: SyncConflict[];
	resolveConflict: (
		id: number,
		resolution: "local" | "server" | "merged",
	) => Promise<void>;
	isOnline: boolean;
}

export function useEnhancedSync(
	options: UseEnhancedSyncOptions = {},
): UseEnhancedSyncReturn {
	const {
		autoSync = true,
		syncInterval = 30000,
		maxRetries = 3,
		onSync,
		onConflict,
	} = options;

	const [syncStats, setSyncStats] = useState({
		pending: 0,
		syncing: 0,
		failed: 0,
		total: 0,
	});
	const [isOnlineState, setIsOnlineState] = useState(true);
	const [conflicts, setConflicts] = useState<SyncConflict[]>([]);

	const updateStats = useCallback(async () => {
		const stats = await getSyncQueueStats();
		setSyncStats(stats);
	}, []);

	const checkConflicts = useCallback(async () => {
		const unresolved = await getUnresolvedConflicts();
		setConflicts(unresolved);
		if (unresolved.length > 0) {
			onConflict?.(unresolved[0]);
		}
	}, [onConflict]);

	const processNextItem = useCallback(async (): Promise<boolean> => {
		if (!isOnlineState) return false;

		const item = await getNextSyncItem();
		if (!item) return false;

		if (item.retryAfter && item.retryAfter > Date.now()) {
			return false;
		}

		await markSyncItemSyncing(item.id!);

		try {
			if (onSync) {
				const success = await onSync(item);
				if (success) {
					await markSyncItemSuccess(item.id!);
				} else {
					await markSyncItemFailed(
						item.id!,
						"Sync failed",
						item.attempts + 1,
						maxRetries,
					);
				}
			} else {
				await markSyncItemSuccess(item.id!);
			}
			return true;
		} catch (error) {
			await markSyncItemFailed(
				item.id!,
				error instanceof Error ? error.message : "Unknown error",
				item.attempts + 1,
				maxRetries,
			);
			return false;
		}
	}, [isOnlineState, onSync, maxRetries]);

	const syncNow = useCallback(async () => {
		if (!isOnlineState) return;

		await updateStats();
		let processed = 0;
		const maxItems = 20;

		while (processed < maxItems) {
			const processedItem = await processNextItem();
			if (!processedItem) break;
			processed++;
			await updateStats();
		}
	}, [isOnlineState, processNextItem, updateStats]);

	const retryFailed = useCallback(async (): Promise<number> => {
		const retried = await retryFailedSyncItems();
		await updateStats();
		return retried;
	}, [updateStats]);

	const handleResolveConflict = useCallback(
		async (
			id: number,
			resolution: "local" | "server" | "merged",
		): Promise<void> => {
			await resolveConflict(id, resolution);
			await checkConflicts();
		},
		[checkConflicts],
	);

	useEffect(() => {
		updateStats();
		checkConflicts();
	}, [updateStats, checkConflicts]);

	useEffect(() => {
		const handleOnline = () => setIsOnlineState(true);
		const handleOffline = () => setIsOnlineState(false);

		const cleanup = createOfflineHandler(handleOnline, handleOffline);
		setIsOnlineState(isOnline());

		return cleanup;
	}, []);

	useEffect(() => {
		if (!autoSync || !isOnlineState) return;

		const interval = setInterval(async () => {
			await processNextItem();
			await updateStats();
		}, syncInterval);

		return () => clearInterval(interval);
	}, [autoSync, isOnlineState, syncInterval, processNextItem, updateStats]);

	return {
		syncStats,
		syncNow,
		retryFailed,
		hasConflicts: conflicts.length > 0,
		conflicts,
		resolveConflict: handleResolveConflict,
		isOnline: isOnlineState,
	};
}
