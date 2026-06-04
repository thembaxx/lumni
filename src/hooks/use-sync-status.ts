"use client";

import { useState } from "react";
import { offlineDB } from "@/lib/db/schema";
import { useInterval } from "./use-interval";
import { useOnlineStatus } from "./useOnlineStatus";
import { logError } from "@/lib/shared/logger";

export function useSyncStatus() {
	const { isOnline } = useOnlineStatus();
	const [pendingCount, setPendingCount] = useState(0);

	useInterval(async () => {
		try {
			const items = await offlineDB.jobs
				.where("status")
				.equals("pending")
				.count();
			setPendingCount(items);
		} catch (err) {
			logError("UseSyncStatus", err);
			setPendingCount(0);
		}
	}, 10000);

	return { isOnline, pendingCount };
}
