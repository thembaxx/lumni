"use client";

import { motion } from "framer-motion";
import type { StreakMilestone } from "@/types/gamification";

interface StreakCelebrationProps {
	currentStreak: number;
	milestones: StreakMilestone[];
}

const streakEmojis: Record<number, string> = {
	0: "😴",
	1: "🌱",
	2: "🌿",
	3: "🔥",
	4: "🔥",
	5: "💥",
	6: "⚡",
	7: "🌟",
	8: "✨",
	9: "💫",
	10: "🌈",
};

function getStreakEmoji(streak: number): string {
	if (streak >= 30) return "👑";
	if (streak >= 14) return "🏆";
	if (streak >= 7) return "🎯";
	if (streak >= 3) return "🔥";
	return streakEmojis[streak] || "🌱";
}

function getStreakMessage(streak: number): string {
	if (streak >= 30) return "Legendary!";
	if (streak >= 14) return "Unstoppable!";
	if (streak >= 7) return "Week Warrior!";
	if (streak >= 3) return "On Fire!";
	if (streak >= 1) return "Keep it up!";
	return "Start your streak!";
}

export function StreakCelebration({
	currentStreak,
	milestones,
}: StreakCelebrationProps) {
	const nextMilestone = milestones.find((m) => !m.unlocked);
	const progress = nextMilestone
		? (currentStreak / nextMilestone.streak) * 100
		: 100;

	const isMilestone = currentStreak > 0 && currentStreak % 7 === 0;

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			className={`relative overflow-hidden rounded-2xl p-4 transition-all ${
				isMilestone
					? "bg-gradient-to-br from-orange-500/20 via-amber-500/10 to-card border border-orange-500/30"
					: "bg-card border border-border/50"
			}`}
		>
			{isMilestone && (
				<motion.div
					className="absolute inset-0 pointer-events-none"
					initial={{ opacity: 0 }}
					animate={{ opacity: [0, 0.3, 0] }}
					transition={{ duration: 2, repeat: Infinity }}
				>
					<div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />
				</motion.div>
			)}

			<div className="flex items-center gap-4">
				<motion.div
					className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg"
					animate={currentStreak >= 3 ? { scale: [1, 1.05, 1] } : {}}
					transition={{ duration: 1.5, repeat: Infinity }}
				>
					<span className="text-2xl">{getStreakEmoji(currentStreak)}</span>
					{currentStreak >= 3 && (
						<motion.span
							className="absolute -top-1 -right-1 text-lg"
							animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
							transition={{ duration: 2, repeat: Infinity }}
						>
							✨
						</motion.span>
					)}
				</motion.div>

				<div className="flex-1">
					<div className="flex items-center justify-between mb-1">
						<span className="text-lg font-bold text-foreground">
							{currentStreak} day{currentStreak !== 1 ? "s" : ""}
						</span>
						<span
							className={`text-xs font-medium ${
								isMilestone
									? "text-orange-600 dark:text-orange-400"
									: "text-muted-foreground"
							}`}
						>
							{getStreakMessage(currentStreak)}
						</span>
					</div>

					{nextMilestone && currentStreak < nextMilestone.streak && (
						<>
							<div className="relative h-2 bg-secondary rounded-full overflow-hidden">
								<motion.div
									className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-orange-500 to-amber-500"
									initial={{ width: 0 }}
									animate={{ width: `${Math.min(progress, 100)}%` }}
									transition={{ duration: 0.8 }}
								/>
							</div>
							<p className="text-xs text-muted-foreground mt-1">
								{nextMilestone.streak - currentStreak} days to unlock:{" "}
								{nextMilestone.reward}
							</p>
						</>
					)}

					{currentStreak >= (nextMilestone?.streak || 0) && (
						<p className="text-xs text-green-600 dark:text-green-400 mt-1">
							🎉 Milestone reached!
						</p>
					)}
				</div>
			</div>
		</motion.div>
	);
}
