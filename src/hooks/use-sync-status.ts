"use client";

import { useEffect, useState } from "react";
import { getAllSyncItems } from "@/lib/db/offline";

export function useSyncStatus() {
	const [isOnline, setIsOnline] = useState(true);
	const [pendingCount, setPendingCount] = useState(0);

	useEffect(() => {
		setIsOnline(navigator.onLine);

		const handleOnline = () => setIsOnline(true);
		const handleOffline = () => setIsOnline(false);

		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);

		const interval = setInterval(async () => {
			try {
				const items = await getAllSyncItems();
				setPendingCount(items.filter((i) => i.status !== "syncing").length);
			} catch {
				setPendingCount(0);
			}
		}, 10000);

		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
			clearInterval(interval);
		};
	}, []);

	return { isOnline, pendingCount };
}
