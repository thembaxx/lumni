"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { ThemeProvider } from "@/components/theme";
import { WebVitalsLogger } from "@/components/web-vitals";
import { prefetchUploadSubjects } from "@/lib/hooks/use-upload-subjects";
import { queryClient } from "@/lib/query-client";
import { useAppStore } from "@/lib/store";

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
				{children}
				<WebVitalsLogger />
			</ThemeProvider>
		</QueryClientProvider>
	);
}
