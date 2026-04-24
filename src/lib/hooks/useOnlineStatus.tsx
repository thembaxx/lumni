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

export function OnlineStatusIndicator() {
	const { isOnline } = useOnlineStatus();

	if (isOnline) return null;

	return (
		<div
			style={{
				position: "fixed",
				bottom: "1rem",
				left: "50%",
				transform: "translateX(-50%)",
				backgroundColor: "#f59e0b",
				color: "white",
				padding: "0.5rem 1rem",
				borderRadius: "0.5rem",
				fontSize: "0.875rem",
				fontWeight: 500,
				zIndex: 9999,
			}}
		>
			You&apos;re offline. Changes will sync when reconnected.
		</div>
	);
}
