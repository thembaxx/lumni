"use client";

import { motion } from "framer-motion";
import { LottieWrapper } from "@/components/lottie";
import { iOSEase } from "@/lib/utils/animation";

export function FlashcardsLoading() {
	return (
		<motion.div
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4, ease: iOSEase }}
			className="min-h-[100dvh] bg-background grid grid-cols-12 gap-0"
		>
			<div className="col-span-12 md:col-span-7 col-start-1 flex items-center justify-center p-4">
				<div className="max-w-md w-full mx-auto overflow-hidden rounded-[2.5rem] border border-border/80 bg-card shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
					<div className="p-8 text-left">
						<LottieWrapper animation="loading-lumni" className="w-16 h-16 mb-4" loop />
						<p className="text-muted-foreground">Loading flashcards...</p>
					</div>
				</div>
			</div>
			<div className="col-span-12 md:col-span-5 col-start-1 md:col-start-8 relative overflow-hidden bg-system-surface/30">
				<div className="absolute inset-0 bg-gradient-to-br from-[--system-accent]/10 via-transparent to-transparent" />
				<div className="absolute inset-0 flex items-center justify-center p-8">
					<div className="w-full h-full max-w-xs aspect-square rounded-3xl bg-[--system-accent]/10 blur-2xl animate-float-slow" />
				</div>
			</div>
		</motion.div>
	);
}