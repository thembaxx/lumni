"use client";

import { useState } from "react";
import { getAllSyncItems } from "@/lib/db/offline";
import { useInterval } from "./use-interval";
import { useOnlineStatus } from "./useOnlineStatus";

export function useSyncStatus() {
	const { isOnline } = useOnlineStatus();
	const [pendingCount, setPendingCount] = useState(0);

	useInterval(async () => {
		try {
			const items = await getAllSyncItems();
			setPendingCount(items.filter((i) => i.status !== "syncing").length);
		} catch {
			setPendingCount(0);
		}
	}, 10000);

	return { isOnline, pendingCount };
}
