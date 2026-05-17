"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { JoyProvider } from "@/components/celebration";
import { OnboardingProvider } from "@/components/onboarding/onboarding-provider";
import { ThemeProvider } from "@/components/theme";
import { PremiumProvider } from "@/lib/premium/premium-context";
import { ToastProvider } from "@/components/ui/toast";
import { WebVitalsLogger } from "@/components/web-vitals";
import { useJobProcessor } from "@/hooks/use-job-processor";
import { prefetchUploadSubjects } from "@/hooks/use-upload-subjects";
import { OnlineStatusIndicator } from "@/hooks/useOnlineStatus";
import { AuthProvider } from "@/lib/auth/auth-context";
import { queryClient } from "@/lib/query-client";
import { handleSync } from "@/lib/sync/sync-handler";
import { initSyncQueue, useAutoSync } from "@/lib/sync-queue";
import { useAppStore } from "@/store";

function AutoSyncWrapper() {
	useAutoSync();
	return null;
}

function JobProcessorWrapper() {
	useJobProcessor();
	return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
	const setInitialized = useAppStore((s) => s.setInitialized);

	useEffect(() => {
		initSyncQueue({ onSync: handleSync });

		const handlePrefetch = async () => {
			await prefetchUploadSubjects(queryClient);
			setInitialized(true);
		};
		handlePrefetch();
	}, [setInitialized]);

	return (
		<QueryClientProvider client={queryClient}>
			<ThemeProvider>
				<AuthProvider>
					<JoyProvider>
						<ToastProvider>
							<OnboardingProvider>
								<PremiumProvider>{children}</PremiumProvider>
							</OnboardingProvider>
							<WebVitalsLogger />
							<OnlineStatusIndicator />
							<AutoSyncWrapper />
							<JobProcessorWrapper />
						</ToastProvider>
					</JoyProvider>
				</AuthProvider>
			</ThemeProvider>
		</QueryClientProvider>
	);
}
