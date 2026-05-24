"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "@/components/ui/toast";
import type { StoredGamification } from "@/lib/gamification-engine";
import { gamificationEngine } from "@/lib/gamification-engine";
import type { Achievement, LevelInfo } from "@/types/gamification";
import {
	ACHIEVEMENTS,
	calculateLevel,
	type UserGamification,
} from "@/types/gamification";

export function useGamification() {
	const [data, setData] = useState<StoredGamification>(
		gamificationEngine.load(),
	);
	const prevLevelRef = useRef<number>(0);
	const [leveledUp, setLeveledUp] = useState<LevelInfo | null>(null);
	const [pendingAchievement, setPendingAchievement] =
		useState<Achievement | null>(null);

	useEffect(() => {
		const stored = gamificationEngine.load();
		const merged = gamificationEngine.mergeWithDefaults(stored);
		if (merged !== stored) {
			gamificationEngine.save(merged);
		}
		setData(merged);
		prevLevelRef.current = calculateLevel(merged.totalXp).level;
	}, []);

	const levelInfo = calculateLevel(data.totalXp);

	const clearLevelUp = useCallback(() => setLeveledUp(null), []);
	const clearAchievement = useCallback(() => setPendingAchievement(null), []);

	const earnedAchievements = ACHIEVEMENTS.map((achievement) => {
		const stored = data.achievements.find((a) => a.id === achievement.id);
		return {
			...achievement,
			earnedAt: stored?.earnedAt ?? null,
		};
	});

	const gamification: UserGamification = {
		xp: data.xp,
		level: levelInfo.level,
		totalXp: data.totalXp,
		achievements: earnedAchievements,
		dailyChallenges: data.dailyChallenges,
		streakMilestones: data.streakMilestones,
		lastPracticeDate: data.lastPracticeDate,
	};

	const addXp = useCallback(
		(amount: number, accuracy: number, streak: number, subject?: string) => {
			setData((prev) => {
				const { data: newData, leveledUp: newLevel } = gamificationEngine.addXp(
					prev,
					amount,
					accuracy,
					streak,
					subject,
				);
				if (newLevel !== null) {
					setLeveledUp(calculateLevel(newData.totalXp));
					prevLevelRef.current = newLevel;
				}
				gamificationEngine.save(newData);
				return newData;
			});
		},
		[],
	);

	const addAchievement = useCallback((achievementId: string) => {
		setData((prev) => {
			const { data: newData, achievement } = gamificationEngine.addAchievement(
				prev,
				achievementId,
			);
			if (achievement) {
				setPendingAchievement(achievement);
				setTimeout(() => {
					toast({
						type: "success",
						message: `${achievement.icon} New Achievement: ${achievement.name}`,
						description: achievement.description,
						duration: 5000,
					});
				}, 0);
			}
			gamificationEngine.save(newData);
			return newData;
		});
	}, []);

	const checkAndUnlockAchievements = useCallback(
		(
			questionsAnswered: number,
			accuracy: number,
			streak: number,
			currentLevel: number,
			perfectQuiz: boolean,
		) => {
			const newAchievements = gamificationEngine.checkAndUnlockAchievements(
				data,
				questionsAnswered,
				accuracy,
				streak,
				currentLevel,
				perfectQuiz,
			);
			for (const id of newAchievements) addAchievement(id);
		},
		[data, addAchievement],
	);

	const _streakXpReward = useCallback(
		(streak: number): number => gamificationEngine.getStreakXpReward(streak),
		[],
	);

	const updateStreak = useCallback(() => {
		setData((prev) => {
			const { data: newData } = gamificationEngine.updateStreak(prev);
			gamificationEngine.save(newData);
			return newData;
		});
	}, []);

	const completeDailyChallenge = useCallback((challengeId: string) => {
		setData((prev) => {
			const { data: newData } = gamificationEngine.completeDailyChallenge(
				prev,
				challengeId,
			);
			gamificationEngine.save(newData);
			return newData;
		});
	}, []);

	return {
		gamification,
		levelInfo,
		isLoaded: true,
		addXp,
		addAchievement,
		checkAndUnlockAchievements,
		updateStreak,
		completeDailyChallenge,
		currentStreak: data.currentStreak,
		totalQuestionsAnswered: data.totalQuestionsAnswered,
		leveledUp,
		pendingAchievement,
		clearLevelUp,
		clearAchievement,
	};
}
