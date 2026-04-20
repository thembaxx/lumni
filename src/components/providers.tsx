"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme-provider";
import { WebVitalsLogger } from "@/components/web-vitals";
import { prefetchUploadSubjects } from "@/lib/hooks/use-upload-subjects";
import { queryClient } from "@/lib/query-client";
import { useAppStore, useUploadStore } from "@/lib/store";

export function Providers({ children }: { children: React.ReactNode }) {
	const setInitialized = useAppStore((s) => s.setInitialized);

	const handlePrefetch = async () => {
		await prefetchUploadSubjects(queryClient);
		setInitialized(true);
	};

	handlePrefetch();

	return (
		<QueryClientProvider client={queryClient}>
			<ThemeProvider>
				{children}
				<WebVitalsLogger />
			</ThemeProvider>
		</QueryClientProvider>
	);
}
