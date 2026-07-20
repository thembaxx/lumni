"use client";

import { useCallback, useEffect, useReducer, useState } from "react";

interface ServiceWorkerState {
  registration: ServiceWorkerRegistration | null;
  isReady: boolean;
  isUpdated: boolean;
}

type ServiceWorkerAction =
  | { type: "REGISTERED"; registration: ServiceWorkerRegistration }
  | { type: "UPDATED" }
  | { type: "READY" };

function swReducer(state: ServiceWorkerState, action: ServiceWorkerAction): ServiceWorkerState {
  switch (action.type) {
    case "REGISTERED":
      return { ...state, registration: action.registration };
    case "UPDATED":
      return { ...state, isUpdated: true };
    case "READY":
      return { ...state, isReady: true };
  }
}

export interface UseServiceWorkerReturn {
  registration: ServiceWorkerRegistration | null;
  isReady: boolean;
  isUpdated: boolean;
  update: () => void;
  skipWaiting: () => void;
  cacheQuestions: (subject: string, questions: unknown[]) => void;
}

export function useServiceWorker(): UseServiceWorkerReturn {
  const [{ registration, isReady, isUpdated }, dispatch] = useReducer(swReducer, {
    registration: null,
    isReady: false,
    isUpdated: false,
  });

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const abortController = new AbortController();
    const { signal } = abortController;

    const updateFoundHandler = () => {
      /* handled via reg.addEventListener below */
    };

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        if (signal.aborted) return;
        dispatch({ type: "REGISTERED", registration: reg });

        if (reg.waiting) {
          dispatch({ type: "UPDATED" });
        }

        reg.addEventListener(
          "updatefound",
          () => {
            const newWorker = reg.installing;
            if (newWorker) {
              const stateHandler = () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  if (!signal.aborted) dispatch({ type: "UPDATED" });
                }
              };
              newWorker.addEventListener("statechange", stateHandler, { signal });
            }
          },
          { signal },
        );
        dispatch({ type: "READY" });
      })
      .catch((error) => {
        if (signal.aborted) return;
        import("@/lib/shared/logger").then(({ logError }) => {
          logError("ServiceWorker.register", error);
        });
      });

    return () => {
      abortController.abort();
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

export interface UsePWAInstallReturn {
  isInstallable: boolean;
  install: () => void;
  dismissed: boolean;
  dismiss: (persist?: boolean) => void;
  resetPwaDismiss: () => void;
}

export function usePWAInstall(): UsePWAInstallReturn {
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
      import("@/lib/observability/events").then(({ trackEvent }) => {
        trackEvent("pwa_install", "install_accepted");
      });
    } else {
      import("@/lib/observability/events").then(({ trackEvent }) => {
        trackEvent("pwa_install", "install_dismissed");
      });
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const dismiss = useCallback((persist = false) => {
    setIsInstallable(false);
    setDismissed(true);
    if (persist) {
      localStorage.setItem("pwa-install-dismissed", "true");
    }
  }, []);

  const resetPwaDismiss = useCallback(() => {
    localStorage.removeItem("pwa-install-dismissed");
    setDismissed(false);
  }, []);

  return { isInstallable, install, dismissed, dismiss, resetPwaDismiss };
}
