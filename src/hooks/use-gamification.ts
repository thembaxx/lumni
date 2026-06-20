"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "@/components/ui/toast";
import { dexieDataAccess, type ObservabilityDataAccess } from "@/lib/db";
import type { StoredGamification } from "@/lib/gamification-engine";
import { GamificationService } from "@/lib/gamification-engine/service";
import {
	getSettings,
	sendLocalNotification,
} from "@/lib/services/notification-service";
import { logError } from "@/lib/shared/logger";

let _deps: { db: ObservabilityDataAccess } = { db: dexieDataAccess };
export function __setDepsForTesting(deps: { db: ObservabilityDataAccess }) {
	_deps = deps;
}

let _serviceInstance: GamificationService | null = null;
function getService(): GamificationService {
	if (!_serviceInstance) {
		_serviceInstance = new GamificationService({ db: _deps.db });
	}
	return _serviceInstance;
}

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
	const service = useMemo(() => getService(), []);
	const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

	const [data, setData] = useState<StoredGamification>(() =>
		service.getState(),
	);
	const prevLevelRef = useRef<number>(calculateLevel(data.totalXp).level);
	const [leveledUp, setLeveledUp] = useState<LevelInfo | null>(null);
	const [pendingAchievement, setPendingAchievement] =
		useState<Achievement | null>(null);
	const [pendingChest, setPendingChest] = useState<RewardChestDef | null>(null);

	useEffect(() => {
		const unsub = service.subscribe((newData) => {
			setData(newData);
		});
		return unsub;
	}, [service]);

	useEffect(() => {
		service
			.loadFromDexie()
			.catch((err) => logError("useGamificationLoadDexie", err));
		const syncedKey = "__gamification_synced";
		if (!sessionStorage.getItem(syncedKey)) {
			sessionStorage.setItem(syncedKey, "1");
			service
				.syncFromServer()
				.catch((err) => logError("useGamificationSyncFromServer", err));
		}
	}, [service]);

	useEffect(() => {
		const timersAtMount = timersRef.current;
		return () => {
			for (const id of timersAtMount) clearTimeout(id);
		};
	}, []);

	const levelInfo = calculateLevel(data.totalXp);

	const clearLevelUp = useCallback(() => setLeveledUp(null), []);
	const clearAchievement = useCallback(() => setPendingAchievement(null), []);
	const clearChest = useCallback(() => setPendingChest(null), []);

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

	const addXp = useCallback(
		(amount: number, accuracy: number, streak: number, subject?: string) => {
			const result = service.addXp(amount, accuracy, streak, subject);
			if (result.leveledUp) {
				setLeveledUp(calculateLevel(result.data.totalXp));
				prevLevelRef.current = calculateLevel(result.data.totalXp).level;
			}
		},
		[service],
	);

	const addAchievement = useCallback(
		(achievementId: string) => {
			const result = service.addAchievement(achievementId);
			if (result.achievement) {
				setPendingAchievement(result.achievement);
				const achTimer = setTimeout(() => {
					toast({
						type: "success",
						message: `${result.achievement?.icon} New Achievement: ${result.achievement?.name}`,
						description: result.achievement?.description,
						duration: 5000,
					});
					const notifSettings = getSettings();
					if (notifSettings.enabled && notifSettings.achievementNotifications) {
						sendLocalNotification(
							`${result.achievement?.icon} ${result.achievement?.name}`,
							result.achievement?.description ?? "",
						);
					}
				}, 0);
				timersRef.current.push(achTimer);
			}
		},
		[service],
	);

	const checkAndUnlockAchievements = useCallback(
		(
			questionsAnswered: number,
			accuracy: number,
			streak: number,
			currentLevel: number,
			perfectQuiz: boolean,
		) => {
			const achievements = service.checkAndUnlockAchievements(
				questionsAnswered,
				accuracy,
				streak,
				currentLevel,
				perfectQuiz,
			);
			for (const ach of achievements) {
				setPendingAchievement(ach);
				const achTimer = setTimeout(() => {
					toast({
						type: "success",
						message: `${ach.icon} New Achievement: ${ach.name}`,
						description: ach.description,
						duration: 5000,
					});
					const notifSettings = getSettings();
					if (notifSettings.enabled && notifSettings.achievementNotifications) {
						sendLocalNotification(`${ach.icon} ${ach.name}`, ach.description);
					}
				}, 0);
				timersRef.current.push(achTimer);
			}
		},
		[service],
	);

	const updateStreak = useCallback(() => {
		const result = service.updateStreak();
		if (result.freezeConsumed) {
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
	}, [service]);

	const consumeStreakFreeze = useCallback(() => {
		service.consumeStreakFreeze();
	}, [service]);

	const addStreakFreeze = useCallback(
		(count?: number) => {
			service.addStreakFreeze(count);
		},
		[service],
	);

	const completeDailyChallenge = useCallback(
		(challengeId: string) => {
			service.completeDailyChallenge(challengeId);
		},
		[service],
	);

	const checkForRewardChests = useCallback(() => {
		const result = service.checkForRewardChests();
		if (result.chest) {
			setPendingChest(result.chest);
			const chestTimer = setTimeout(() => {
				toast({
					type: "success",
					message: `${result.chest?.icon} Reward Chest: ${result.chest?.name}`,
					description: `You earned ${result.chest?.xpReward} bonus XP!`,
					duration: 5000,
				});
			}, 0);
			timersRef.current.push(chestTimer);
		}
	}, [service]);

	return {
		gamification,
		levelInfo,
		isLoaded: true,
		addXp,
		addAchievement,
		checkAndUnlockAchievements,
		updateStreak,
		useStreakFreeze: consumeStreakFreeze,
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
