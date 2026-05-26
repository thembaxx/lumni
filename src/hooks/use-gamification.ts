"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "@/components/ui/toast";
import { offlineDB } from "@/lib/db/schema";
import type { StoredGamification } from "@/lib/gamification-engine";
import { gamificationEngine } from "@/lib/gamification-engine";
import { apiFetch } from "@/lib/shared/api-fetch";
import type {
	Achievement,
	LevelInfo,
	RewardChestDef,
} from "@/types/gamification";
import {
	ACHIEVEMENTS,
	calculateLevel,
	REWARD_CHESTS,
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
	const [pendingChest, setPendingChest] = useState<RewardChestDef | null>(null);
	const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		const stored = gamificationEngine.load();
		const merged = gamificationEngine.mergeWithDefaults(stored);
		if (merged !== stored) {
			gamificationEngine.save(merged);
		}
		setData(merged);
		prevLevelRef.current = calculateLevel(merged.totalXp).level;

		// Try to load from server on mount
		syncFromServer().then((serverData) => {
			if (serverData) {
				const mergedServer = gamificationEngine.mergeWithDefaults({
					...merged,
					totalXp: Math.max(merged.totalXp, serverData.totalXp),
					achievements: mergeAchievements(
						merged.achievements,
						serverData.achievements,
					),
					currentStreak: Math.max(
						merged.currentStreak,
						serverData.currentStreak,
					),
					totalQuestionsAnswered: Math.max(
						merged.totalQuestionsAnswered,
						serverData.totalQuestionsAnswered,
					),
				});
				gamificationEngine.save(mergedServer);
				setData(mergedServer);
			}
		});
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

	const scheduleSync = useCallback((newData: StoredGamification) => {
		if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
		syncTimerRef.current = setTimeout(() => {
			syncToServer(newData);
			// biome-ignore lint/suspicious/noExplicitAny: Dexie table type mismatch
			offlineDB.gamification.put({ ...newData, id: 1 } as any).catch(() => {});
		}, 2000);
	}, []);

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
				scheduleSync(newData);
				return newData;
			});
		},
		[scheduleSync],
	);

	const addAchievement = useCallback(
		(achievementId: string) => {
			setData((prev) => {
				const { data: newData, achievement } =
					gamificationEngine.addAchievement(prev, achievementId);
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
				scheduleSync(newData);
				return newData;
			});
		},
		[scheduleSync],
	);

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

	const updateStreak = useCallback(() => {
		setData((prev) => {
			const { data: newData } = gamificationEngine.updateStreak(prev);
			gamificationEngine.save(newData);
			scheduleSync(newData);
			return newData;
		});
	}, [scheduleSync]);

	const completeDailyChallenge = useCallback(
		(challengeId: string) => {
			setData((prev) => {
				const { data: newData } = gamificationEngine.completeDailyChallenge(
					prev,
					challengeId,
				);
				gamificationEngine.save(newData);
				scheduleSync(newData);
				return newData;
			});
		},
		[scheduleSync],
	);

	const checkForRewardChests = useCallback(() => {
		setData((prev) => {
			const { data: newData, chest } =
				gamificationEngine.checkAndClaimRewardChest(prev);
			if (chest) {
				setPendingChest(chest);
				setTimeout(() => {
					toast({
						type: "success",
						message: `${chest.icon} Reward Chest: ${chest.name}`,
						description: `You earned ${chest.xpReward} bonus XP!`,
						duration: 5000,
					});
				}, 0);
			}
			if (newData !== prev) {
				gamificationEngine.save(newData);
				scheduleSync(newData);
			}
			return newData;
		});
	}, [scheduleSync]);

	const clearChest = useCallback(() => setPendingChest(null), []);

	return {
		gamification,
		levelInfo,
		isLoaded: true,
		addXp,
		addAchievement,
		checkAndUnlockAchievements,
		updateStreak,
		completeDailyChallenge,
		checkForRewardChests,
		currentStreak: data.currentStreak,
		totalQuestionsAnswered: data.totalQuestionsAnswered,
		claimedChests: data.claimedChests,
		rewardChests: REWARD_CHESTS,
		leveledUp,
		pendingAchievement,
		pendingChest,
		clearLevelUp,
		clearAchievement,
		clearChest,
	};
}

async function syncToServer(data: StoredGamification) {
	try {
		await apiFetch("/api/gamification", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data),
		});
	} catch {
		// Silently fail — will retry on next mutation
	}
}

async function syncFromServer(): Promise<StoredGamification | null> {
	try {
		const res = await apiFetch<{ gamification: StoredGamification | null }>(
			"/api/gamification",
			{},
		);
		return res.gamification;
	} catch {
		return null;
	}
}

function mergeAchievements(
	local: { id: string; earnedAt: string }[],
	remote: { id: string; earnedAt: string }[],
): { id: string; earnedAt: string }[] {
	const entries = new Map<string, string>();
	for (const a of [...local, ...remote]) {
		const existing = entries.get(a.id);
		if (!existing || a.earnedAt < existing) {
			entries.set(a.id, a.earnedAt);
		}
	}
	return Array.from(entries.entries()).map(([id, earnedAt]) => ({
		id,
		earnedAt,
	}));
}
