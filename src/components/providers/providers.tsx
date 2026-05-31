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
import { ToastProvider } from "@/components/ui/toast";
import { useJobProcessor } from "@/hooks/use-job-processor";
import { useServiceWorker } from "@/hooks/use-service-worker";
import { prefetchUploadSubjects } from "@/hooks/use-upload-subjects";
import { OnlineStatusIndicator } from "@/hooks/useOnlineStatus";
import { AuthProvider } from "@/lib/auth/auth-context";
import { ConsentProvider } from "@/lib/consent/consent-context";
import { PremiumProvider } from "@/lib/premium/premium-context";
import { queryClient } from "@/lib/query-client";
import { setAppInitialized } from "@/store";

function JobProcessorWrapper() {
	useJobProcessor();
	return null;
}

function ServiceWorkerWrapper() {
	useServiceWorker();
	return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
	useEffect(() => {
		const handlePrefetch = async () => {
			await prefetchUploadSubjects(queryClient);
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
							<ToastProvider>
								<PremiumProvider>
									<I18nProvider>
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
							</ToastProvider>
						</JoyProvider>
					</ConsentProvider>
				</AuthProvider>
			</ThemeProvider>
		</QueryClientProvider>
	);
}
