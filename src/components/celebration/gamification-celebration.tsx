"use client";

import { useGamification } from "@/hooks/use-gamification";
import { AchievementUnlock } from "./achievement-unlock";
import { Confetti } from "./confetti";
import { LevelUp } from "./level-up";

export function GamificationCelebration() {
	const { leveledUp, pendingAchievement, clearLevelUp, clearAchievement } =
		useGamification();

	return (
		<>
			<LevelUp
				visible={!!leveledUp}
				level={leveledUp?.level ?? 1}
				title={leveledUp?.title ?? ""}
				xpToNext={leveledUp?.xpToNextLevel ?? 0}
				onClose={clearLevelUp}
			/>
			<Confetti trigger={!!leveledUp} count={60} duration={2500} />
			{pendingAchievement && (
				<AchievementUnlock
					visible
					icon={pendingAchievement.icon}
					name={pendingAchievement.name}
					description={pendingAchievement.description}
					xpReward={pendingAchievement.xpReward}
					rarity={pendingAchievement.rarity}
					onClose={clearAchievement}
				/>
			)}
		</>
	);
}
