"use client";

import { motion } from "framer-motion";
import { LottieWrapper } from "@/components/lottie";
import { Skeleton } from "@/components/ui/skeleton";
import { iOSEase } from "@/lib/utils/animation";

export default function Loading() {
	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.3, ease: iOSEase }}
			className="min-h-[100dvh] flex flex-col bg-background"
		>
			<nav className="flex items-center justify-between px-4 py-3 w-full">
				<Skeleton className="w-10 h-10 rounded-full" />

				<div className="flex flex-col items-center space-y-4">
					<div className="flex bg-secondary/40 p-1 rounded-2xl gap-1">
						<Skeleton className="h-10 w-16 rounded-full" />
						<Skeleton className="h-10 w-16 rounded-full" />
					</div>
				</div>

				<Skeleton className="w-10 h-10 rounded-xl" />
			</nav>

			<main className="flex-1 flex flex-col items-center justify-center gap-3">
				<LottieWrapper animation="loading-dots" className="w-16 h-8" loop />
				<Skeleton className="h-8 w-32 rounded-full" />
				<Skeleton className="h-4 w-48 rounded-full" />
			</main>

			<div className="px-4 pb-6 space-y-3">
				<div className="flex gap-2 flex-wrap">
					<Skeleton className="h-8 w-20 rounded-full" />
					<Skeleton className="h-8 w-24 rounded-full" />
					<Skeleton className="h-8 w-16 rounded-full" />
					<Skeleton className="h-8 w-28 rounded-full" />
				</div>

				<div className="flex items-center gap-2">
					<Skeleton className="w-9 h-9 rounded-full" />
					<Skeleton className="h-9 flex-1 rounded-full" />
				</div>
			</div>
		</motion.div>
	);
}
