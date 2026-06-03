"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/observability/events";

export default function OfflinePage() {
	useEffect(() => {
		trackEvent("offline_visit", "offline_page");
	}, []);
	return (
		<div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background p-8 text-center">
			<div className="flex size-16 items-center justify-center rounded-full bg-warning/10">
				<svg
					className="size-8 text-warning"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					strokeWidth={2}
					role="img"
					aria-label="Offline indicator"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M18.364 5.636a9 9 0 010 12.728M5.636 18.364a9 9 0 010-12.728M8.464 15.536a5 5 0 010-7.072m7.072 0a5 5 0 010 7.072M12 14a2 2 0 100-4 2 2 0 000 4z"
					/>
				</svg>
			</div>
			<div>
				<h1 className="font-bold text-2xl tracking-tight">
					You&apos;re Offline
				</h1>
				<p className="mt-2 max-w-md text-muted-foreground">
					Don&apos;t worry — your saved questions, flashcards, and study plan
					are still available. Connect to the internet to sync progress.
				</p>
			</div>
			<div className="flex flex-wrap justify-center gap-3">
				<a
					href="/quiz"
					className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-medium text-primary-foreground text-sm"
				>
					Practice Offline
				</a>
				<a
					href="/flashcards"
					className="inline-flex items-center gap-2 rounded-xl bg-muted px-5 py-3 font-medium text-foreground text-sm"
				>
					Review Flashcards
				</a>
			</div>
		</div>
	);
}
