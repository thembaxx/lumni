"use client";

import { motion } from "framer-motion";
import { SpinnerGap } from "@phosphor-icons/react";
import { Skeleton } from "@/components/ui/skeleton";
import { iOSEase } from "@/lib/utils/animation";

export default function Loading() {
	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.3, ease: iOSEase }}
			className="min-h-[100dvh] flex flex-col items-center justify-center bg-background"
		>
			<main className="flex flex-col items-center gap-8">
				<motion.div
					initial={{ scale: 0.9 }}
					animate={{ scale: 1 }}
					transition={{ duration: 0.4, ease: iOSEase }}
				>
					<motion.div
						animate={{ rotate: 360 }}
						transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
					>
						<SpinnerGap className="size-24 text-foreground" />
					</motion.div>
				</motion.div>
				<Skeleton className="h-4 w-48 rounded-full" />
				<div className="flex flex-col items-center gap-4 w-full max-w-xs">
					<Skeleton className="h-1 w-full rounded-full" />
					<Skeleton className="h-10 w-32 rounded-full" />
				</div>
			</main>
		</motion.div>
	);
}