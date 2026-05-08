"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

export interface SyncResult {
	success: boolean;
	synced: number;
	local: number;
	version: string;
	isFresh?: boolean;
	error?: string;
}

export function useSyncSingleSubject(subject: string) {
	const [syncStatus, setSyncStatus] = useState<
		"idle" | "syncing" | "done" | "error"
	>("idle");

	const syncMutation = useMutation({
		mutationFn: async (): Promise<SyncResult> => {
			const response = await fetch("/api/sync", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ subject, action: "sync" }),
			});

			if (!response.ok) {
				throw new Error("Sync failed");
			}

			return response.json();
		},
		onMutate: () => {
			setSyncStatus("syncing");
		},
		onSuccess: () => {
			setSyncStatus("done");
		},
		onError: () => {
			setSyncStatus("error");
		},
	});

	const refreshMutation = useMutation({
		mutationFn: async (): Promise<SyncResult> => {
			const response = await fetch("/api/sync", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ subject, action: "refresh" }),
			});

			if (!response.ok) {
				throw new Error("Refresh failed");
			}

			return response.json();
		},
	});

	return {
		sync: syncMutation.mutate,
		refresh: refreshMutation.mutate,
		isLoading: syncMutation.isPending || refreshMutation.isPending,
		isSyncing: syncStatus === "syncing",
		isError: syncMutation.isError || refreshMutation.isError,
		error: syncMutation.error || refreshMutation.error,
		result: syncMutation.data || refreshMutation.data,
		reset: () => {
			syncMutation.reset();
			refreshMutation.reset();
			setSyncStatus("idle");
		},
	};
}
