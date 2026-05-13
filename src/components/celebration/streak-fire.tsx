"use client";

import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { LottieWrapper } from "@/components/lottie";
import { getStreakMessage } from "@/lib/utils/gamification";

interface StreakFireProps {
	streak: number;
	showMilestone?: boolean;
	milestone?: number;
	useLottie?: boolean;
}

export function StreakFire({
	streak,
	showMilestone,
	milestone,
	useLottie = true,
}: StreakFireProps) {
	const isMilestone = showMilestone && milestone && streak >= milestone;

	return (
		<div className="flex items-center gap-2">
			<div className="relative">
				{useLottie ? (
					<LottieWrapper animation="streak-fire" className="w-10 h-10" loop />
				) : (
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
						<Flame
							className={`w-6 h-6 ${streak >= 7 ? "text-[oklch(72%_0.16_45)]" : "text-[oklch(78%_0.12_55)]"}`}
							fill={streak >= 7 ? "currentColor" : "none"}
						/>
					</motion.div>
				)}

				{streak >= 3 && (
					<motion.div
						className="absolute -top-1 -right-1"
						initial={{ scale: 0 }}
						animate={{ scale: 1 }}
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
						<div className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
							{getStreakMessage(milestone)}
						</div>
					</motion.div>
				)}
			</div>

			<motion.span
				className={`font-bold ${streak >= 7 ? "text-[oklch(72%_0.16_45)]" : "text-[oklch(78%_0.12_55)]"}`}
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
