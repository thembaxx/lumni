"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { JoyProvider } from "@/components/celebration";
import { ThemeProvider } from "@/components/theme";
import { WebVitalsLogger } from "@/components/web-vitals";
import { useJobProcessor } from "@/hooks/use-job-processor";
import { prefetchUploadSubjects } from "@/hooks/use-upload-subjects";
import { OnlineStatusIndicator } from "@/hooks/useOnlineStatus";
import { handleCompetencySync } from "@/lib/competency-engine/sync-handler";
import { queryClient } from "@/lib/query-client";
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
		initSyncQueue({ onSync: handleCompetencySync });

		const handlePrefetch = async () => {
			await prefetchUploadSubjects(queryClient);
			setInitialized(true);
		};
		handlePrefetch();
	}, [setInitialized]);

	return (
		<QueryClientProvider client={queryClient}>
			<ThemeProvider>
				<JoyProvider>
					{children}
					<WebVitalsLogger />
					<OnlineStatusIndicator />
					<AutoSyncWrapper />
					<JobProcessorWrapper />
				</JoyProvider>
			</ThemeProvider>
		</QueryClientProvider>
	);
}
