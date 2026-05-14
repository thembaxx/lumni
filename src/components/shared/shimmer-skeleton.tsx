"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ShimmerSkeletonProps {
	className?: string;
	width?: string | number;
	height?: string | number;
	borderRadius?: string;
}

export function ShimmerSkeleton({
	className,
	width = "100%",
	height = "1rem",
	borderRadius = "0.5rem",
}: ShimmerSkeletonProps) {
	return (
		<motion.div
			className={cn(
				"relative overflow-hidden bg-[--system-surface-secondary]",
				className,
			)}
			style={{ width, height, borderRadius }}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.3 }}
		>
			<motion.div
				className="absolute inset-0 bg-gradient-to-r from-transparent via-[--system-accent]/10 to-transparent"
				initial={{ x: "-100%" }}
				animate={{ x: "100%" }}
				transition={{
					duration: 1.5,
					repeat: Infinity,
					repeatType: "loop",
					ease: "easeInOut",
				}}
			/>
		</motion.div>
	);
}
