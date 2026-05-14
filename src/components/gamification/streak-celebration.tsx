"use client";

import { motion } from "framer-motion";
import { AnimatedProgressBar } from "@/components/shared/animated-progress-bar";
import { FadeIn } from "@/components/shared/fade-in";
import { getStreakMessage } from "@/lib/utils/gamification";
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
		<FadeIn
			distance={10}
			className={`relative overflow-hidden rounded-2xl p-4 transition-colors transition-background ${
				isMilestone
					? "bg-warning/20 border border-warning/30"
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
					<div className="absolute inset-0 bg-warning/20" />
				</motion.div>
			)}

			<div className="flex items-center gap-4">
				<motion.div
					className="relative flex size-12 items-center justify-center rounded-xl bg-warning shadow-lg"
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
						<span className="text-lg font-extrabold text-foreground">
							{currentStreak} day{currentStreak !== 1 ? "s" : ""}
						</span>
						<span
							className={`text-xs font-medium ${
								isMilestone ? "text-warning" : "text-muted-foreground"
							}`}
						>
							{getStreakMessage(currentStreak)}
						</span>
					</div>

					{nextMilestone && currentStreak < nextMilestone.streak && (
						<>
							<AnimatedProgressBar
								value={Math.min(progress, 100)}
								size="lg"
								color="warning"
								trackClassName="bg-secondary"
							/>
							<p className="text-xs text-muted-foreground mt-1">
								{nextMilestone.streak - currentStreak} days to unlock:{" "}
								{nextMilestone.reward}
							</p>
						</>
					)}

					{currentStreak >= (nextMilestone?.streak || 0) && (
						<motion.p
							initial={{ opacity: 0, y: 5 }}
							animate={{ opacity: 1, y: 0 }}
							className="text-xs text-success-foreground mt-1"
						>
							Milestone reached!
						</motion.p>
					)}
				</div>
			</div>
		</FadeIn>
	);
}
