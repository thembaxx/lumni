"use client";

import { motion } from "framer-motion";
import { Flame } from "lucide-react";

interface StreakFireProps {
	streak: number;
	showMilestone?: boolean;
	milestone?: number;
}

const milestoneMessages: Record<number, string> = {
	3: "On Fire!",
	7: "Week Warrior!",
	14: "Two Weeks!",
	30: "Unstoppable!",
	60: "Legendary!",
	100: "Grandmaster!",
};

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
					<Flame
						className={`w-6 h-6 ${streak >= 7 ? "text-orange-500" : "text-amber-500"}`}
						fill={streak >= 7 ? "currentColor" : "none"}
					/>
				</motion.div>

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
						<div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
							{milestoneMessages[milestone] || "Milestone!"}
						</div>
					</motion.div>
				)}
			</div>

			<motion.span
				className={`font-bold ${streak >= 7 ? "text-orange-500" : "text-amber-500"}`}
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
