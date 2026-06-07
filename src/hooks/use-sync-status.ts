"use client";

import { useState } from "react";
import { dexieDataAccess, type SyncDataAccess } from "@/lib/db";
import { logError } from "@/lib/shared/logger";
import { useInterval } from "./use-interval";

let _deps: { db: SyncDataAccess } = { db: dexieDataAccess };
export function __setDepsForTesting(deps: { db: SyncDataAccess }) {
	_deps = deps;
}

import { useOnlineStatus } from "./useOnlineStatus";

export function useSyncStatus() {
	const { isOnline } = useOnlineStatus();
	const [pendingCount, setPendingCount] = useState(0);

	useInterval(async () => {
		try {
			const items = await _deps.db.jobs
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
