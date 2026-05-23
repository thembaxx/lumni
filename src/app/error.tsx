"use client";

import { Home01Icon, RefreshIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { m } from "framer-motion";
import { Button } from "@/components/ui/button";
import { iOSEase } from "@/lib/utils/animation";
import { AnimatedIcon } from "@/lib/utils/icon-mapping";

export default function AppError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<div className="min-h-dvh bg-[--system-background]">
			<div className="grid min-h-dvh grid-cols-12 gap-0">
				{/* Main content — left-aligned */}
				<main className="col-span-12 col-start-1 flex flex-col justify-center px-[--space-6] py-[--space-10] md:col-span-7 md:px-[--space-12] md:py-[--space-14]">
					<m.div
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.4, ease: iOSEase }}
						className="flex max-w-md flex-col gap-[--space-8]"
					>
						<m.div
							initial={{ scale: 0.8 }}
							animate={{ scale: 1 }}
							transition={{ duration: 0.5, ease: iOSEase, delay: 0.1 }}
							className="relative"
						>
							<div className="absolute inset-0 rounded-full bg-destructive/10 blur-xl" />
							<div className="relative flex size-28 items-center justify-center rounded-[--radius-card] border border-destructive/20 bg-destructive/10">
								<m.div
									initial={{ scale: 0.95, opacity: 0 }}
									animate={{ scale: 1, opacity: 1 }}
									transition={{ delay: 0.3 }}
								>
									<AnimatedIcon name="error-state" className="size-20" />
								</m.div>
							</div>
						</m.div>

						<div className="flex flex-col gap-[--space-2]">
							<h2 className="ios-title-2 text-[--system-text-primary]">
								Something went wrong
							</h2>
							<p className="ios-callout text-[--system-text-secondary]">
								{error?.message ||
									"An unexpected error occurred. Please try again."}
							</p>
							{error?.digest && (
								<p className="ios-footnote font-mono text-[--system-text-tertiary]">
									Error ID: {error.digest}
								</p>
							)}
						</div>

						<div className="flex flex-col gap-[--space-3] sm:flex-row">
							<Button onClick={() => reset()} className="gap-2">
								<HugeiconsIcon icon={RefreshIcon} className="size-4" />
								Try again
							</Button>
							<Button
								variant="outline"
								onClick={() => (window.location.href = "/")}
								className="gap-2"
							>
								<HugeiconsIcon icon={Home01Icon} className="size-4" />
								Go Home
							</Button>
						</div>

						<p className="ios-footnote text-[--system-text-tertiary]">
							If this persists, please contact support.
						</p>
					</m.div>
				</main>

				{/* Decorative accent — right zone */}
				<div className="relative col-span-12 col-start-1 overflow-hidden bg-system-surface/30 md:col-span-5 md:col-start-8">
					<m.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.6, delay: 0.2 }}
						className="absolute inset-0 bg-linear-to-br from-destructive/5 via-transparent to-transparent"
					/>
					<div className="absolute inset-0 flex items-center justify-center p-8">
						<div className="aspect-square h-full w-full max-w-xs animate-float-slow rounded-3xl bg-destructive/10 blur-2xl" />
					</div>
				</div>
			</div>
		</div>
	);
}
