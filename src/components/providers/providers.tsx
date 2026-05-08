"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { JoyProvider } from "@/components/celebration";
import { ThemeProvider } from "@/components/theme";
import { WebVitalsLogger } from "@/components/web-vitals";
import { prefetchUploadSubjects } from "@/lib/hooks/use-upload-subjects";
import { OnlineStatusIndicator } from "@/lib/hooks/useOnlineStatus";
import { queryClient } from "@/lib/query-client";
import { useAutoSync } from "@/lib/sync-queue";
import { useAppStore } from "@/store";

function AutoSyncWrapper() {
	useAutoSync();
	return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
	const setInitialized = useAppStore((s) => s.setInitialized);

	useEffect(() => {
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
				</JoyProvider>
			</ThemeProvider>
		</QueryClientProvider>
	);
}
