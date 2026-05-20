"use client";

import { m } from "framer-motion";
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
				<h3 className="font-semibold text-foreground text-sm">Achievements</h3>
				<span className="text-muted-foreground text-xs">
					{earnedCount} / {achievements.length}
				</span>
			</div>

			<div className="scrollbar-hide flex gap-2 overflow-x-auto pb-2">
				{earnedAchievements.slice(0, 6).map((achievement, index) => (
					<m.button
						key={achievement.id}
						initial={{ opacity: 0, scale: 0.8 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ delay: index * 0.05 }}
						whileHover={{ scale: 1.08 }}
						whileTap={{ scale: 0.95 }}
						className={`relative size-14 shrink-0 rounded-xl border-2 ${rarityColors[achievement.rarity]} ${rarityGlow[achievement.rarity]} flex items-center justify-center shadow-lg transition-transform`}
						title={`${achievement.name}: ${achievement.description}`}
					>
						<span className="text-2xl">{achievement.icon}</span>
						{achievement.rarity === "legendary" && (
							<m.span
								className="absolute inset-0 rounded-xl"
								animate={{ opacity: [0.3, 0.6, 0.3] }}
								transition={{ duration: 2, repeat: Infinity }}
								style={{
									boxShadow: "0 0 12px 2px oklch(81.9% 0.145 80° / 0.4)",
								}}
							/>
						)}
					</m.button>
				))}

				{lockedAchievements.slice(0, 3).map((achievement, index) => (
					<m.div
						key={achievement.id}
						initial={{ opacity: 0 }}
						animate={{ opacity: 0.5 }}
						transition={{ delay: (earnedAchievements.length + index) * 0.05 }}
						className="relative flex size-14 shrink-0 items-center justify-center rounded-xl border-2 border-border border-dashed bg-muted/30"
						title={`Locked: ${achievement.name}`}
					>
						<span className="text-xl grayscale">🔒</span>
					</m.div>
				))}

				{achievements.length > 9 && (
					<m.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 0.7 }}
						className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/30 text-muted-foreground text-xs"
					>
						+{achievements.length - 9}
					</m.div>
				)}
			</div>
		</div>
	);
}
