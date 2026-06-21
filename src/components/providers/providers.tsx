"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { JoyProvider } from "@/components/celebration";
import { I18nProvider } from "@/components/i18n/i18n-provider";
import { OnboardingProvider } from "@/components/onboarding/onboarding-provider";
import {
	PWAInstallPrompt,
	PWAUpdateToast,
} from "@/components/pwa/pwa-update-toast";
import { ImmersiveModeProvider } from "@/components/shared/immersive-mode";
import { ThemeProvider } from "@/components/theme";
import { useAnalyticsTracking } from "@/hooks/use-analytics-tracking";
import { useJobProcessor } from "@/hooks/use-job-processor";
import { useServiceWorker } from "@/hooks/use-service-worker";
import { prefetchUploadSubjects } from "@/hooks/use-upload-subjects";
import { OnlineStatusIndicator } from "@/hooks/useOnlineStatus";
import type { Locale } from "@/i18n/locales";
import { AuthProvider } from "@/lib/auth/auth-context";
import { ConsentProvider } from "@/lib/consent/consent-context";
import { PremiumProvider } from "@/lib/premium/premium-context";
import { queryClient } from "@/lib/query-client";
import { seedInteractiveQuestions } from "@/lib/seed-questions";
import { setAppInitialized } from "@/store";

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

export function Providers({
	locale,
	messages,
	timeZone,
	children,
}: ProvidersProps) {
	useEffect(() => {
		const handlePrefetch = async () => {
			await Promise.all([
				prefetchUploadSubjects(queryClient),
				seedInteractiveQuestions(),
			]);
			setAppInitialized(true);
		};
		handlePrefetch();
	}, []);

	return (
		<QueryClientProvider client={queryClient}>
			<ThemeProvider>
				<AuthProvider>
					<ConsentProvider>
						<JoyProvider>
							<PremiumProvider>
								<I18nProvider
									locale={locale}
									messages={messages}
									timeZone={timeZone}
								>
									<OnboardingProvider>
										<ImmersiveModeProvider>{children}</ImmersiveModeProvider>
									</OnboardingProvider>
								</I18nProvider>
							</PremiumProvider>
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
