"use client";

import { ArrowsClockwise, House, Warning } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<html>
			<body
				className="min-h-[100dvh] bg-[--system-background]"
				suppressHydrationWarning
			>
				<div className="grid grid-cols-12 gap-0 min-h-[100dvh]">
					<div className="col-span-12 md:col-span-7 col-start-1 flex items-center justify-center p-4 pb-20">
						<main className="space-y-8 max-w-md text-left">
							<div className="relative">
								<div className="absolute inset-0 animate-pulse rounded-full bg-destructive/10 blur-xl" />
								<div className="relative flex items-center justify-center w-20 h-20 rounded-[--radius-card] bg-destructive/10 border border-destructive/20">
									<Warning className="w-10 h-10 text-destructive" />
								</div>
							</div>

							<div className="space-y-2">
								<h2 className="ios-title-2 text-[--system-text-primary]">
									Something went wrong
								</h2>
								<p className="ios-callout text-[--system-text-secondary]">
									{error.message ||
										"An unexpected error occurred. Please try again."}
								</p>
								{error.digest && (
									<p className="ios-footnote text-[--system-text-tertiary] font-mono">
										Error ID: {error.digest}
									</p>
								)}
							</div>

							<div className="flex flex-col sm:flex-row gap-3">
								<Button onClick={() => reset()} className="gap-2">
									<ArrowsClockwise className="size-4" />
									Try again
								</Button>
								<Button
									variant="outline"
									onClick={() => (window.location.href = "/")}
									className="gap-2"
								>
									<House className="size-4" />
									Go Home
								</Button>
							</div>

							<p className="ios-footnote text-[--system-text-tertiary]">
								If this persists, please contact support.
							</p>
						</main>
					</div>

					<div className="col-span-12 md:col-span-5 col-start-1 md:col-start-8 relative overflow-hidden bg-system-surface/30">
						<div className="absolute inset-0 bg-gradient-to-br from-destructive/5 via-transparent to-transparent" />
						<div className="absolute inset-0 flex items-center justify-center p-8">
							<div className="w-full h-full max-w-xs aspect-square rounded-3xl bg-destructive/10 blur-2xl animate-float-slow" />
						</div>
					</div>
				</div>
			</body>
		</html>
	);
}
