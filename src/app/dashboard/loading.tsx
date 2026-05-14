"use client";

import { CircleNotch } from "@phosphor-icons/react";
import { motion } from "framer-motion";
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

			<main className="flex-1 flex flex-col items-center justify-center gap-[--space-6]">
				<motion.div
					animate={{ rotate: 360 }}
					transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
					className="size-14"
				>
					<CircleNotch className="size-14 text-system-accent" />
				</motion.div>

				<motion.h2
					initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
					animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
					transition={{ duration: 0.4, ease: iOSEase, delay: 0.08 }}
					className="ios-title-2 text-[--system-text-primary] text-center"
				>
					Dashboard
				</motion.h2>

				<motion.p
					initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
					animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
					transition={{ duration: 0.35, ease: iOSEase, delay: 0.12 }}
					className="ios-footnote text-[--system-text-secondary] text-center"
				>
					Loading your content
				</motion.p>
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
