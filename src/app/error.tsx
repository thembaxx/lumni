"use client";

import { motion } from "framer-motion";
import { House, ArrowsClockwise } from "@phosphor-icons/react";
import { LottieWrapper } from "@/components/lottie";
import { Button } from "@/components/ui/button";
import { iOSEase } from "@/lib/utils/animation";

export default function Error({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
return (
		<div className="min-h-[100dvh] bg-[--system-background]">
			<div className="grid grid-cols-12 gap-0 min-h-[100dvh]">
				{/* Main content — left-aligned */}
				<main className="col-span-12 md:col-span-7 col-start-1 flex flex-col justify-center px-[--space-6] py-[--space-10] md:px-[--space-12] md:py-[--space-14]">
					<motion.div
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.4, ease: iOSEase }}
						className="space-y-[--space-8] max-w-md"
					>
						<motion.div
							initial={{ scale: 0.8 }}
							animate={{ scale: 1 }}
							transition={{ duration: 0.5, ease: iOSEase, delay: 0.1 }}
							className="relative"
						>
							<div className="absolute inset-0 rounded-full bg-destructive/10 blur-xl" />
							<div className="relative flex items-center justify-center w-28 h-28 rounded-[--radius-card] bg-destructive/10 border border-destructive/20">
								<LottieWrapper
									animation="error-state"
									className="w-20 h-20"
									loop={false}
								/>
							</div>
						</motion.div>

						<div className="space-y-[--space-2]">
							<h2 className="ios-title-2 text-[--system-text-primary]">
								Something went wrong
							</h2>
							<p className="ios-callout text-[--system-text-secondary]">
								{error.message || "An unexpected error occurred. Please try again."}
							</p>
							{error.digest && (
								<p className="ios-footnote text-[--system-text-tertiary] font-mono">
									Error ID: {error.digest}
								</p>
							)}
						</div>

						<div className="flex flex-col sm:flex-row gap-[--space-3]">
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
					</motion.div>
				</main>

				{/* Decorative accent — right zone */}
				<div className="col-span-12 md:col-span-5 col-start-1 md:col-start-8 relative overflow-hidden bg-system-surface/30">
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.6, delay: 0.2 }}
						className="absolute inset-0 bg-gradient-to-br from-destructive/5 via-transparent to-transparent"
					/>
					<div className="absolute inset-0 flex items-center justify-center p-8">
						<div className="w-full h-full max-w-xs aspect-square rounded-3xl bg-destructive/10 blur-2xl animate-float-slow" />
					</div>
				</div>
			</div>
		</div>
	);
}
