"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface SyncResult {
	success: boolean;
	synced: number;
	local: number;
	version: string;
	isFresh?: boolean;
	error?: string;
}

export function useSyncSubject(subject: string) {
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

	const triggerSync = syncMutation.mutate;
	const triggerRefresh = refreshMutation.mutate;

	return {
		sync: triggerSync,
		refresh: triggerRefresh,
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

export function useAutoSync(subject: string) {
	const [syncStatus, setSyncStatus] = useState<
		"idle" | "syncing" | "done" | "error"
	>("idle");

	const query = useQuery<SyncResult>({
		queryKey: ["sync-status", subject],
		queryFn: async () => {
			const response = await fetch("/api/sync", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ subject, action: "check" }),
			});

			if (!response.ok) {
				throw new Error("Check failed");
			}

			return response.json();
		},
		enabled: !!subject,
		staleTime: 5 * 60 * 1000,
		retry: 1,
	});

	const syncMutation = useMutation({
		mutationFn: async (): Promise<SyncResult> => {
			setSyncStatus("syncing");
			const response = await fetch("/api/sync", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ subject, action: "sync" }),
			});

			if (!response.ok) {
				throw new Error("Sync failed");
			}

			const result = await response.json();
			setSyncStatus("done");
			return result;
		},
		onError: () => {
			setSyncStatus("error");
		},
	});

	const needsSync = query.data && !query.data.isFresh && query.data.version;

	return {
		...query,
		sync: syncMutation.mutate,
		isLoading: query.isLoading,
		isSyncing: syncStatus === "syncing" || query.isFetching,
		needsSync: needsSync ?? false,
		result: query.data,
	};
}

export function useSyncAll() {
	const [syncStatus, setSyncStatus] = useState<
		"idle" | "syncing" | "done" | "error"
	>("idle");

	const syncAllMutation = useMutation({
		mutationFn: async () => {
			const response = await fetch("/api/sync", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action: "sync-all" }),
			});

			if (!response.ok) {
				throw new Error("Sync all failed");
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

	return {
		syncAll: syncAllMutation.mutate,
		isLoading: syncAllMutation.isPending,
		isSyncing: syncStatus === "syncing",
		isError: syncAllMutation.isError,
		result: syncAllMutation.data,
		reset: () => {
			syncAllMutation.reset();
			setSyncStatus("idle");
		},
	};
}
