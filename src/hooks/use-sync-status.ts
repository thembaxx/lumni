"use client";

import { useState } from "react";
import { dexieDataAccess } from "@/lib/db";
import { logError } from "@/lib/shared/logger";
import { useInterval } from "./use-interval";
import { useOnlineStatus } from "./useOnlineStatus";

export function useSyncStatus() {
	const { isOnline } = useOnlineStatus();
	const [pendingCount, setPendingCount] = useState(0);

	useInterval(async () => {
		try {
			const items = await dexieDataAccess.jobs
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
