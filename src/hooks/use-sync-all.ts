"use client";

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import type { SyncResult } from "./use-sync-single";

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
