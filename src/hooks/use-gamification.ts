"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "@/components/ui/toast";
import { offlineDB } from "@/lib/db/schema";
import type { StoredGamification } from "@/lib/gamification-engine";
import { gamificationEngine } from "@/lib/gamification-engine";
import { saveWeeklySnapshot } from "@/lib/services/leaderboard-service";
import { apiFetch } from "@/lib/shared/api-fetch";
import { logError } from "@/lib/shared/logger";
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
	const [data, setData] = useState<StoredGamification>(() => {
		const stored = gamificationEngine.load();
		const merged = gamificationEngine.mergeWithDefaults(stored);
		if (merged !== stored) {
			gamificationEngine.save(merged);
		}
		return merged;
	});
	const prevLevelRef = useRef<number>(calculateLevel(data.totalXp).level);
	const [leveledUp, setLeveledUp] = useState<LevelInfo | null>(null);
	const [pendingAchievement, setPendingAchievement] =
		useState<Achievement | null>(null);
	const [pendingChest, setPendingChest] = useState<RewardChestDef | null>(null);
	const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const syncedRef = useRef(false);
	const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

	// Try to load from server on mount (once)
	useEffect(() => {
		if (syncedRef.current) return;
		syncedRef.current = true;
		syncFromServer().then((serverData) => {
			if (serverData) {
				setData((prev) => {
					const merged = gamificationEngine.mergeWithDefaults({
						...prev,
						...serverData,
					});
					gamificationEngine.save(merged);
					return merged;
				});
			}
		});
	}, []);

	// Cleanup all timers on unmount
	useEffect(() => {
		const syncTimerAtMount = syncTimerRef.current;
		const timersAtMount = timersRef.current;
		return () => {
			if (syncTimerAtMount) clearTimeout(syncTimerAtMount);
			for (const id of timersAtMount) clearTimeout(id);
		};
	}, []);

	const levelInfo = calculateLevel(data.totalXp);

	const clearLevelUp = useCallback(() => setLeveledUp(null), []);
	const clearAchievement = useCallback(() => setPendingAchievement(null), []);

	const earnedAchievements = useMemo(
		() =>
			ACHIEVEMENTS.map((achievement) => {
				const stored = data.achievements.find((a) => a.id === achievement.id);
				return {
					...achievement,
					earnedAt: stored?.earnedAt ?? null,
				};
			}),
		[data.achievements],
	);

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
			const x: StoredGamification & { id: number } = { ...newData, id: 1 };
			offlineDB.gamification
				.put(x)
				.catch((e) => console.warn("[Gamification] Failed to save", e));
		}, 2000);
		timersRef.current.push(syncTimerRef.current);
	}, []);

	const addXp = useCallback(
		(amount: number, accuracy: number, streak: number, subject?: string) => {
			setData((prev) => {
				const working = subject
					? gamificationEngine.trackSubjectQuestion(prev, subject, amount)
					: prev;
				const { data: newData, leveledUp: newLevel } = gamificationEngine.addXp(
					working,
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
				const label =
					typeof window !== "undefined"
						? window.localStorage.getItem("lumni_display_name") || undefined
						: undefined;
				const snapTimer = setTimeout(() => {
					saveWeeklySnapshot(
						label || "You",
						newData.totalXp,
						newData.currentStreak,
					);
				}, 0);
				timersRef.current.push(snapTimer);
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
					const achTimer = setTimeout(() => {
						toast({
							type: "success",
							message: `${achievement.icon} New Achievement: ${achievement.name}`,
							description: achievement.description,
							duration: 5000,
						});
					}, 0);
					timersRef.current.push(achTimer);
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
			const { data: newData, freezeConsumed } =
				gamificationEngine.updateStreak(prev);
			if (freezeConsumed) {
				const freezeTimer = setTimeout(() => {
					toast({
						type: "info",
						message: "🧊 Streak Freeze Used",
						description:
							"Your streak was protected! Earn more freezes by reaching streak milestones.",
						duration: 4000,
					});
				}, 0);
				timersRef.current.push(freezeTimer);
			}
			gamificationEngine.save(newData);
			scheduleSync(newData);
			return newData;
		});
	}, [scheduleSync]);

	const useStreakFreeze = useCallback(() => {
		setData((prev) => {
			const { data: newData, success } =
				gamificationEngine.consumeStreakFreeze(prev);
			if (success) {
				gamificationEngine.save(newData);
				scheduleSync(newData);
			}
			return newData;
		});
	}, [scheduleSync]);

	const addStreakFreeze = useCallback(
		(count?: number) => {
			setData((prev) => {
				const newData = gamificationEngine.addStreakFreeze(prev, count);
				gamificationEngine.save(newData);
				scheduleSync(newData);
				return newData;
			});
		},
		[scheduleSync],
	);

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
				const chestTimer = setTimeout(() => {
					toast({
						type: "success",
						message: `${chest.icon} Reward Chest: ${chest.name}`,
						description: `You earned ${chest.xpReward} bonus XP!`,
						duration: 5000,
					});
				}, 0);
				timersRef.current.push(chestTimer);
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
		useStreakFreeze,
		addStreakFreeze,
		completeDailyChallenge,
		checkForRewardChests,
		currentStreak: data.currentStreak,
		streakFreezes: data.streakFreezes,
		subjectQuestionCounts: data.subjectQuestionCounts,
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
		const label =
			(typeof window !== "undefined"
				? window.localStorage.getItem("lumni_display_name")
				: null) || undefined;
		await apiFetch("/api/gamification", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ ...data, label }),
		});
	} catch (err) {
		logError("SyncToServer", err);
	}
}

async function syncFromServer(): Promise<StoredGamification | null> {
	try {
		const res = await apiFetch<{ gamification: StoredGamification | null }>(
			"/api/gamification",
			{},
		);
		return res.gamification;
	} catch (err) {
		logError("SyncFromServer", err);
		return null;
	}
}
