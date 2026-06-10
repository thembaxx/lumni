"use client";

import { m } from "framer-motion";
import { useTranslations } from "next-intl";
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

function StreakCelebration({
	currentStreak,
	milestones,
}: StreakCelebrationProps) {
	const t = useTranslations();
	const nextMilestone = milestones.find((m) => !m.unlocked);
	const progress = nextMilestone
		? (currentStreak / nextMilestone.streak) * 100
		: 100;

	const isMilestone = currentStreak > 0 && currentStreak % 7 === 0;

	return (
		<FadeIn
			distance={10}
			className={`relative overflow-hidden rounded-2xl p-4 transition-background transition-colors ${
				isMilestone
					? "border border-warning/30 bg-warning/20"
					: "border border-border/50 bg-card"
			}`}
		>
			{isMilestone && (
				<m.div
					className="pointer-events-none absolute inset-0"
					initial={{ opacity: 0 }}
					animate={{ opacity: [0, 0.3, 0] }}
					transition={{ duration: 2, repeat: Infinity }}
				>
					<div className="absolute inset-0 bg-warning/20" />
				</m.div>
			)}

			<div className="flex items-center gap-4">
				<m.div
					className="relative flex size-12 items-center justify-center rounded-xl bg-warning shadow-lg"
					animate={currentStreak >= 3 ? { scale: [1, 1.05, 1] } : {}}
					transition={{ duration: 1.5, repeat: Infinity }}
				>
					<span className="text-2xl">{getStreakEmoji(currentStreak)}</span>
					{currentStreak >= 3 && (
						<m.span
							className="absolute -top-1 -right-1 text-lg"
							animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
							transition={{ duration: 2, repeat: Infinity }}
						>
							✨
						</m.span>
					)}
				</m.div>

				<div className="flex-1">
					<div className="mb-1 flex items-center justify-between">
						<span className="font-extrabold text-foreground text-lg">
							{t("gamification.streakCount", { count: currentStreak })}
						</span>
						<span
							className={`font-medium text-xs ${
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
							<p className="mt-1 text-muted-foreground text-xs">
								{t("gamification.daysToUnlock", {
									delta: nextMilestone.streak - currentStreak,
									reward: nextMilestone.reward,
								})}
							</p>
						</>
					)}

					{currentStreak >= (nextMilestone?.streak || 0) && (
						<m.p
							initial={{ opacity: 0, y: 5 }}
							animate={{ opacity: 1, y: 0 }}
							className="mt-1 text-success-foreground text-xs"
						>
							{t("gamification.milestoneReached")}
						</m.p>
					)}
				</div>
			</div>
		</FadeIn>
	);
}
