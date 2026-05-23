"use client";

import { useSyncExternalStore } from "react";

function getOnlineStatus(): boolean {
	if (typeof navigator === "undefined") return true;
	return navigator.onLine;
}

function subscribe(callback: () => void): () => void {
	if (typeof window === "undefined") return () => {};

	const handleOnline = () => callback();
	const handleOffline = () => callback();

	window.addEventListener("online", handleOnline);
	window.addEventListener("offline", handleOffline);

	return () => {
		window.removeEventListener("online", handleOnline);
		window.removeEventListener("offline", handleOffline);
	};
}

export function useOnlineStatus(): {
	isOnline: boolean;
	isOffline: boolean;
} {
	const isOnline = useSyncExternalStore(
		subscribe,
		getOnlineStatus,
		() => true, // Server-side fallback
	);

	return {
		isOnline,
		isOffline: !isOnline,
	};
}

export function OnlineStatusIndicator() {
	const { isOnline } = useOnlineStatus();

	if (isOnline) return null;

	return (
		<div
			className="fixed bottom-4 left-1/2 z-toast w-full -translate-x-1/2 text-pretty rounded-lg bg-warning px-4 py-2 font-medium text-primary-foreground text-sm shadow-level-2"
			role="status"
			aria-live="polite"
		>
			You&apos;re offline. Changes will sync when reconnected.
		</div>
	);
}
