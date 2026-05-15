"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGamification } from "@/hooks/use-gamification";
import { cn } from "@/lib/utils";
import { iOSEase } from "@/lib/utils/animation";

const rarityColors: Record<string, string> = {
	common: "bg-muted text-muted-foreground",
	rare: "bg-blue-500/10 text-blue-500",
	epic: "bg-purple-500/10 text-purple-500",
	legendary: "bg-amber-500/10 text-amber-500",
};

export function AchievementShowcase() {
	const { gamification } = useGamification();

	const earned = gamification.achievements.filter((a) => a.earnedAt);
	if (earned.length === 0) return null;

	const latest = earned.slice(-3).reverse();

	return (
		<motion.div
			initial={{ opacity: 0, y: 16 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4, ease: iOSEase }}
		>
			<Card>
				<CardHeader>
					<CardTitle className="text-base font-extrabold tracking-tight flex items-center gap-2">
						Achievements
					</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-2">
					{earned.length > 0 && (
						<p className="text-xs text-muted-foreground mb-1">
							{earned.length} of {gamification.achievements.length} unlocked
						</p>
					)}
					<div className="flex flex-wrap gap-2">
						{latest.map((achievement) => (
							<div
								key={achievement.id}
								className={cn(
									"flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium",
									rarityColors[achievement.rarity] || rarityColors.common,
								)}
							>
								<span>{achievement.icon}</span>
								<span>{achievement.name}</span>
							</div>
						))}
						{earned.length > 3 && (
							<div className="flex items-center px-3 py-1.5 rounded-full bg-muted text-xs font-medium text-muted-foreground">
								+{earned.length - 3} more
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		</motion.div>
	);
}
