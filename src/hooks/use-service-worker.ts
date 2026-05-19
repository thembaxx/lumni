"use client";

import { useCallback, useEffect, useState } from "react";

export interface UseServiceWorkerReturn {
	registration: ServiceWorkerRegistration | null;
	isReady: boolean;
	isUpdated: boolean;
	update: () => void;
	skipWaiting: () => void;
	cacheQuestions: (subject: string, questions: unknown[]) => void;
}

export function useServiceWorker(): UseServiceWorkerReturn {
	const [registration, setRegistration] =
		useState<ServiceWorkerRegistration | null>(null);
	const [isReady, setIsReady] = useState(false);
	const [isUpdated, setIsUpdated] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
			return;
		}

		let cancelled = false;
		let activeReg: ServiceWorkerRegistration | null = null;
		let trackedWorker: ServiceWorker | null = null;
		let trackedStateHandler: (() => void) | null = null;

		const updateFoundHandler = () => {
			const newWorker = activeReg?.installing;
			if (newWorker) {
				if (trackedWorker && trackedStateHandler) {
					trackedWorker.removeEventListener("statechange", trackedStateHandler);
				}
				trackedStateHandler = () => {
					if (
						newWorker.state === "installed" &&
						navigator.serviceWorker.controller
					) {
						if (!cancelled) setIsUpdated(true);
					}
				};
				newWorker.addEventListener("statechange", trackedStateHandler);
				trackedWorker = newWorker;
			}
		};

		navigator.serviceWorker
			.register("/sw.js")
			.then((reg) => {
				if (cancelled) return;
				activeReg = reg;
				setRegistration(reg);

				if (reg.waiting) {
					setIsUpdated(true);
				}

				reg.addEventListener("updatefound", updateFoundHandler);
				setIsReady(true);
			})
			.catch((error) => {
				if (cancelled) return;
				console.error("Service worker registration failed:", error);
			});

		return () => {
			cancelled = true;
			if (activeReg) {
				activeReg.removeEventListener("updatefound", updateFoundHandler);
			}
			if (trackedWorker && trackedStateHandler) {
				trackedWorker.removeEventListener("statechange", trackedStateHandler);
			}
		};
	}, []);

	const update = useCallback(() => {
		registration?.update();
	}, [registration]);

	const skipWaiting = useCallback(() => {
		if (registration?.waiting) {
			registration.waiting.postMessage({ type: "SKIP_WAITING" });
		}
	}, [registration]);

	const cacheQuestions = useCallback(
		(subject: string, questions: unknown[]) => {
			if (registration?.active) {
				registration.active.postMessage({
					type: "CACHE_QUESTIONS",
					subject,
					questions,
				});
			}
		},
		[registration],
	);

	return {
		registration,
		isReady,
		isUpdated,
		update,
		skipWaiting,
		cacheQuestions,
	};
}

export function usePWAInstall(): {
	isInstallable: boolean;
	install: () => void;
	dismissed: boolean;
	dismiss: () => void;
} {
	const [isInstallable, setIsInstallable] = useState(false);
	interface BeforeInstallPromptEvent extends Event {
		prompt: () => Promise<void>;
		userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
	}

	const [deferredPrompt, setDeferredPrompt] =
		useState<BeforeInstallPromptEvent | null>(null);
	const [dismissed, setDismissed] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined") return;

		const handler = (e: Event) => {
			const event = e as BeforeInstallPromptEvent;
			event.preventDefault();
			setDeferredPrompt(event);
			const wasDismissed = localStorage.getItem("pwa-install-dismissed");
			if (!wasDismissed) {
				setIsInstallable(true);
			}
		};

		window.addEventListener("beforeinstallprompt", handler as EventListener);

		return () => {
			window.removeEventListener(
				"beforeinstallprompt",
				handler as EventListener,
			);
		};
	}, []);

	const install = useCallback(async () => {
		if (!deferredPrompt) return;

		await deferredPrompt.prompt();

		const choice = await deferredPrompt.userChoice;
		if (choice.outcome === "accepted") {
			setIsInstallable(false);
		}
		setDeferredPrompt(null);
	}, [deferredPrompt]);

	const dismiss = useCallback(() => {
		setIsInstallable(false);
		setDismissed(true);
		localStorage.setItem("pwa-install-dismissed", "true");
	}, []);

	return { isInstallable, install, dismissed, dismiss };
}
