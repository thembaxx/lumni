"use client";

import { useEffect, useSyncExternalStore } from "react";

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

const _Z_INDEX = {
	toast: 50,
	dropdown: 40,
	modal: 30,
	popover: 20,
	header: 10,
	base: 1,
} as const;

export function OnlineStatusIndicator() {
	const { isOnline } = useOnlineStatus();

	if (isOnline) return null;

	return (
		<div
			className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-warning text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium z-[50] shadow-lg"
			role="status"
			aria-live="polite"
		>
			You&apos;re offline. Changes will sync when reconnected.
		</div>
	);
}
