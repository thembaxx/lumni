"use client";

import { motion } from "framer-motion";
import { Home, RefreshCw } from "lucide-react";
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
		<motion.div
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4, ease: iOSEase }}
			className="min-h-screen flex flex-col items-center justify-center bg-[--system-background] px-[--space-4]"
		>
			<main className="flex flex-col items-center gap-[--space-8] text-center max-w-md">
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
						<RefreshCw className="size-4" />
						Try again
					</Button>
					<Button
						variant="outline"
						onClick={() => (window.location.href = "/")}
						className="gap-2"
					>
						<Home className="size-4" />
						Go Home
					</Button>
				</div>

				<p className="ios-footnote text-[--system-text-tertiary]">
					If this persists, please contact support.
				</p>
			</main>
		</motion.div>
	);
}
