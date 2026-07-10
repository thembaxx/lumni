"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import { JoyProvider } from "@/components/celebration";
import { I18nProvider } from "@/components/i18n/i18n-provider";
import { OnboardingProvider } from "@/components/onboarding/onboarding-provider";
import { EasterEggProvider } from "@/lib/shared/easter-egg-context";
import { ImmersiveModeProvider } from "@/components/shared/immersive-mode";
import { SyncProvider } from "@/components/providers/sync-provider";
import { ThemeProvider } from "@/components/theme";
import { useAnalyticsTracking } from "@/hooks/use-analytics-tracking";
import { useJobProcessor } from "@/hooks/use-job-processor";
import { useServiceWorker } from "@/hooks/use-service-worker";
import { prefetchUploadSubjects } from "@/hooks/use-upload-subjects";
import { OnlineStatusIndicator } from "@/hooks/useOnlineStatus";
import type { Locale } from "@/i18n/locales";
import { AuthProvider } from "@/lib/auth/auth-context";
import { ConsentProvider } from "@/lib/consent/consent-context";
import { queryClient } from "@/lib/query-client";
import { seedInteractiveQuestions } from "@/lib/seed-questions";
import { setAppInitialized } from "@/store";

const PWAUpdateToast = dynamic(
  () =>
    import("@/components/pwa/pwa-update-toast").then((m) => ({
      default: m.PWAUpdateToast,
    })),
  { ssr: false },
);
const PWAInstallPrompt = dynamic(
  () =>
    import("@/components/pwa/pwa-update-toast").then((m) => ({
      default: m.PWAInstallPrompt,
    })),
  { ssr: false },
);

function JobProcessorWrapper() {
  useJobProcessor();
  useAnalyticsTracking();
  return null;
}

function ServiceWorkerWrapper() {
  useServiceWorker();
  return null;
}

interface ProvidersProps {
  locale: Locale;
  messages: Record<string, unknown>;
  timeZone: string;
  children: React.ReactNode;
}

export function Providers({ locale, messages, timeZone, children }: ProvidersProps) {
  useEffect(() => {
    // Defer non-critical initialization to idle period
    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => {
        Promise.all([prefetchUploadSubjects(queryClient), seedInteractiveQuestions()]).then(() =>
          setAppInitialized(true),
        );
      });
    } else {
      Promise.all([prefetchUploadSubjects(queryClient), seedInteractiveQuestions()]).then(() =>
        setAppInitialized(true),
      );
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ConsentProvider>
            <JoyProvider>
              <I18nProvider locale={locale} messages={messages} timeZone={timeZone}>
                <OnboardingProvider>
                  <ImmersiveModeProvider>
                    <SyncProvider>
                      <EasterEggProvider>{children}</EasterEggProvider>
                    </SyncProvider>
                  </ImmersiveModeProvider>
                </OnboardingProvider>
              </I18nProvider>
              <OnlineStatusIndicator />
              <JobProcessorWrapper />
              <ServiceWorkerWrapper />
              <PWAUpdateToast />
              <PWAInstallPrompt />
            </JoyProvider>
          </ConsentProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
