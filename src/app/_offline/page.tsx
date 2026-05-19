import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
	title: "Offline - Lumni",
};

export default function OfflinePage() {
	return (
		<div className="min-h-dvh bg-background flex flex-col items-center justify-center p-6 text-center">
			<div className="max-w-md space-y-4">
				<div className="size-20 mx-auto rounded-full bg-muted flex items-center justify-center">
					<svg
						className="size-10 text-muted-foreground"
						fill="none"
						viewBox="0 0 24 24"
						strokeWidth={1.5}
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M3 3l18 18M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m0 0a9 9 0 00-9 9m9-9v18"
						/>
					</svg>
				</div>
				<h1 className="text-2xl font-semibold">You&apos;re offline</h1>
				<p className="text-sm text-muted-foreground">
					Don&apos;t worry - your saved progress and cached questions are
					available. Results will sync when you reconnect.
				</p>
				<div className="flex flex-col gap-2 pt-4">
					<Link
						href="/dashboard"
						className="inline-flex h-11 items-center justify-center rounded-xl bg-foreground text-background px-6 text-sm font-semibold"
					>
						Go to Dashboard
					</Link>
					<Link
						href="/quiz"
						className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-6 text-sm font-semibold"
					>
						Continue Studying
					</Link>
				</div>
			</div>
		</div>
	);
}
