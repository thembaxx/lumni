"use client";

import { motion } from "framer-motion";
import { rarityColors, rarityGlow } from "@/lib/utils/gamification";
import type { Achievement } from "@/types/gamification";

interface AchievementsProps {
	achievements: Achievement[];
}

export function Achievements({ achievements }: AchievementsProps) {
	const earnedCount = achievements.filter((a) => a.earnedAt).length;
	const earnedAchievements = achievements.filter((a) => a.earnedAt);
	const lockedAchievements = achievements.filter((a) => !a.earnedAt);

	return (
		<div className="flex flex-col gap-3">
			<div className="flex items-center justify-between">
				<h3 className="text-sm font-semibold text-foreground">Achievements</h3>
				<span className="text-xs text-muted-foreground">
					{earnedCount} / {achievements.length}
				</span>
			</div>

			<div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
				{earnedAchievements.slice(0, 6).map((achievement, index) => (
					<motion.button
						key={achievement.id}
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ delay: index * 0.05 }}
						whileHover={{ scale: 1.08 }}
						whileTap={{ scale: 0.95 }}
						className={`relative shrink-0 size-14 rounded-xl border-2 ${rarityColors[achievement.rarity]} ${rarityGlow[achievement.rarity]} shadow-lg flex items-center justify-center transition-transform`}
						title={`${achievement.name}: ${achievement.description}`}
					>
						<span className="text-2xl">{achievement.icon}</span>
						{achievement.rarity === "legendary" && (
							<motion.span
								className="absolute inset-0 rounded-xl"
								animate={{ opacity: [0.3, 0.6, 0.3] }}
								transition={{ duration: 2, repeat: Infinity }}
								style={{
									boxShadow: "0 0 12px 2px oklch(81.9% 0.145 80° / 0.4)",
								}}
							/>
						)}
					</motion.button>
				))}

				{lockedAchievements.slice(0, 3).map((achievement, index) => (
					<motion.div
						key={achievement.id}
						initial={{ opacity: 0 }}
						animate={{ opacity: 0.5 }}
						transition={{ delay: (earnedAchievements.length + index) * 0.05 }}
						className="relative shrink-0 size-14 rounded-xl border-2 border-dashed border-border bg-muted/30 flex items-center justify-center"
						title={`Locked: ${achievement.name}`}
					>
						<span className="text-xl grayscale">🔒</span>
					</motion.div>
				))}

				{achievements.length > 9 && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 0.7 }}
						className="shrink-0 size-14 rounded-xl border border-border bg-muted/30 flex items-center justify-center text-xs text-muted-foreground"
					>
						+{achievements.length - 9}
					</motion.div>
				)}
			</div>
		</div>
	);
}
