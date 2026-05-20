"use client";

import { FireIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { motion } from "framer-motion";
import { getStreakMessage } from "@/lib/utils/gamification";

interface StreakFireProps {
	streak: number;
	showMilestone?: boolean;
	milestone?: number;
}

export function StreakFire({
	streak,
	showMilestone,
	milestone,
}: StreakFireProps) {
	const isMilestone = showMilestone && milestone && streak >= milestone;

	return (
		<div className="flex items-center gap-2">
			<div className="relative">
				<motion.div
					animate={{
						scale: [1, 1.2, 1],
						rotate: [0, 5, -5, 0],
					}}
					transition={{
						duration: 0.5,
						repeat: Infinity,
						repeatDelay: 2,
					}}
				>
					<HugeiconsIcon
						icon={FireIcon}
						className={`size-6 ${streak >= 7 ? "fill-warning" : "fill-warning/80"}`}
						fill={streak >= 7 ? "currentColor" : "none"}
					/>
				</motion.div>

				{streak >= 3 && (
					<motion.div
						className="absolute -top-1 -right-1"
						initial={{ scale: 0.95, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						transition={{ delay: 0.3, type: "spring" }}
					>
						<span className="text-lg">
							{streak >= 30 ? "🔥" : streak >= 7 ? "🌟" : "✨"}
						</span>
					</motion.div>
				)}

				{isMilestone && (
					<motion.div
						className="absolute -bottom-2 left-1/2 -translate-x-1/2"
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
					>
						<div className="whitespace-nowrap rounded-full bg-warning px-2 py-0.5 font-extrabold text-[10px] text-primary-foreground">
							{getStreakMessage(milestone)}
						</div>
					</motion.div>
				)}
			</div>

			<motion.span
				className={`font-extrabold ${streak >= 7 ? "text-warning" : "text-warning/80"}`}
				key={streak}
				initial={{ scale: 1.5 }}
				animate={{ scale: 1 }}
				transition={{ type: "spring", stiffness: 500 }}
			>
				{streak}
			</motion.span>
		</div>
	);
}
