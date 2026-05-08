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

		navigator.serviceWorker
			.register("/sw.js")
			.then((reg) => {
				setRegistration(reg);

				if (reg.waiting) {
					setIsUpdated(true);
				}

				reg.addEventListener("updatefound", () => {
					const newWorker = reg.installing;
					if (newWorker) {
						newWorker.addEventListener("statechange", () => {
							if (
								newWorker.state === "installed" &&
								navigator.serviceWorker.controller
							) {
								setIsUpdated(true);
							}
						});
					}
				});

				setIsReady(true);
			})
			.catch((error) => {
				console.error("Service worker registration failed:", error);
			});
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

const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
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
			window.removeEventListener("beforeinstallprompt", handler as EventListener);
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
