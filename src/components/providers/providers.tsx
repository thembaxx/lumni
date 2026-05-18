"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { JoyProvider } from "@/components/celebration";
import { OnboardingProvider } from "@/components/onboarding/onboarding-provider";
import { ThemeProvider } from "@/components/theme";
import { ToastProvider } from "@/components/ui/toast";
import { WebVitalsLogger } from "@/components/web-vitals";
import { useJobProcessor } from "@/hooks/use-job-processor";
import { prefetchUploadSubjects } from "@/hooks/use-upload-subjects";
import { OnlineStatusIndicator } from "@/hooks/useOnlineStatus";
import { AuthProvider } from "@/lib/auth/auth-context";
import { PremiumProvider } from "@/lib/premium/premium-context";
import { queryClient } from "@/lib/query-client";
import { setAppInitialized } from "@/store";

function JobProcessorWrapper() {
	useJobProcessor();
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
					<JoyProvider>
						<ToastProvider>
							<PremiumProvider>
								<OnboardingProvider>{children}</OnboardingProvider>
							</PremiumProvider>
							<OnlineStatusIndicator />
							<JobProcessorWrapper />
						</ToastProvider>
					</JoyProvider>
				</AuthProvider>
			</ThemeProvider>
		</QueryClientProvider>
	);
}
