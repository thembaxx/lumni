"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import {
	ACHIEVEMENTS,
	type Achievement,
	calculateLevel,
	type DailyChallenge,
	generateDailyChallenges,
	type LevelInfo,
	STREAK_MILESTONES,
	type UserGamification,
	XP_PER_CORRECT,
	XP_PER_QUESTION,
	XP_STREAK_BONUS,
} from "@/lib/types/gamification";

const GAMIFICATION_KEY = "lumni_gamification";

interface StoredGamification {
	xp: number;
	totalXp: number;
	achievements: string[];
	dailyChallenges: DailyChallenge[];
	streakMilestones: StreakMilestone[];
	lastPracticeDate: string | null;
	currentStreak: number;
}

interface StreakMilestone {
	streak: number;
	reward: string;
	unlocked: boolean;
}

function getStoredGamification(): StoredGamification {
	if (typeof window === "undefined") {
		return getDefaultGamification();
	}
	try {
		const stored = localStorage.getItem(GAMIFICATION_KEY);
		if (stored) {
			return JSON.parse(stored);
		}
	} catch {}
	return getDefaultGamification();
}

function getDefaultGamification(): StoredGamification {
	return {
		xp: 0,
		totalXp: 0,
		achievements: [],
		dailyChallenges: generateDailyChallenges(),
		streakMilestones: STREAK_MILESTONES.map((s) => ({ ...s })),
		lastPracticeDate: null,
		currentStreak: 0,
	};
}

function saveGamification(data: StoredGamification) {
	if (typeof window === "undefined") return;
	localStorage.setItem(GAMIFICATION_KEY, JSON.stringify(data));
}

function checkDateReset(dailyChallenges: DailyChallenge[]): DailyChallenge[] {
	const today = new Date().toDateString();
	return dailyChallenges.map((challenge) => {
		if (challenge.expiresAt !== today) {
			return {
				...challenge,
				progress: 0,
				completed: false,
				expiresAt: today,
			};
		}
		return challenge;
	});
}

export function useGamification() {
	const [isLoaded, setIsLoaded] = useState(false);
	const [data, setData] = useState<StoredGamification>(getDefaultGamification);

	useEffect(() => {
		const stored = getStoredGamification();
		const resetChallenges = checkDateReset(stored.dailyChallenges);
		if (resetChallenges !== stored.dailyChallenges) {
			stored.dailyChallenges = resetChallenges;
			saveGamification(stored);
		}
		setData(stored);
		setIsLoaded(true);
	}, []);

	const levelInfo = calculateLevel(data.totalXp);

	const earnedAchievements = ACHIEVEMENTS.map((achievement) => ({
		...achievement,
		earnedAt: data.achievements.includes(achievement.id)
			? new Date().toISOString()
			: null,
	}));

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
		(amount: number, isCorrect: boolean, streak: number) => {
			setData((prev) => {
				const baseXp = XP_PER_QUESTION + (isCorrect ? XP_PER_CORRECT : 0);
				const streakBonus = streak > 1 ? XP_STREAK_BONUS : 0;
				const totalXpGain = amount * baseXp + streakBonus;

				const newTotalXp = prev.totalXp + totalXpGain;
				const newXp = prev.xp + totalXpGain;

				const updatedChallenges = prev.dailyChallenges.map((challenge) => {
					if (challenge.type === "questions" && !challenge.completed) {
						const newProgress = Math.min(
							challenge.progress + amount,
							challenge.target,
						);
						return {
							...challenge,
							progress: newProgress,
							completed: newProgress >= challenge.target,
						};
					}
					return challenge;
				});

				const newData = {
					...prev,
					xp: newXp,
					totalXp: newTotalXp,
					dailyChallenges: updatedChallenges,
				};
				saveGamification(newData);
				return newData;
			});
		},
		[],
	);

	const addAchievement = useCallback((achievementId: string) => {
		setData((prev) => {
			if (prev.achievements.includes(achievementId)) return prev;

			const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId);
			if (!achievement) return prev;

			const newAchievements = [...prev.achievements, achievementId];
			const newTotalXp = prev.totalXp + achievement.xpReward;

			const newData = {
				...prev,
				achievements: newAchievements,
				totalXp: newTotalXp,
				xp: prev.xp + achievement.xpReward,
			};
			saveGamification(newData);
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
			const newAchievements: string[] = [];

			if (
				questionsAnswered >= 1 &&
				!data.achievements.includes("first_question")
			) {
				newAchievements.push("first_question");
			}
			if (streak >= 3 && !data.achievements.includes("streak_3")) {
				newAchievements.push("streak_3");
			}
			if (streak >= 7 && !data.achievements.includes("streak_7")) {
				newAchievements.push("streak_7");
			}
			if (streak >= 30 && !data.achievements.includes("streak_30")) {
				newAchievements.push("streak_30");
			}
			if (
				questionsAnswered >= 50 &&
				!data.achievements.includes("questions_50")
			) {
				newAchievements.push("questions_50");
			}
			if (
				questionsAnswered >= 100 &&
				!data.achievements.includes("questions_100")
			) {
				newAchievements.push("questions_100");
			}
			if (
				questionsAnswered >= 500 &&
				!data.achievements.includes("questions_500")
			) {
				newAchievements.push("questions_500");
			}
			if (accuracy >= 80 && !data.achievements.includes("accuracy_80")) {
				newAchievements.push("accuracy_80");
			}
			if (accuracy >= 90 && !data.achievements.includes("accuracy_90")) {
				newAchievements.push("accuracy_90");
			}
			if (perfectQuiz && !data.achievements.includes("perfect_quiz")) {
				newAchievements.push("perfect_quiz");
			}
			if (currentLevel >= 5 && !data.achievements.includes("level_5")) {
				newAchievements.push("level_5");
			}
			if (currentLevel >= 10 && !data.achievements.includes("level_10")) {
				newAchievements.push("level_10");
			}

			newAchievements.forEach((id) => addAchievement(id));
		},
		[data.achievements, addAchievement],
	);

	const updateStreak = useCallback(() => {
		setData((prev) => {
			const today = new Date().toDateString();
			const yesterday = new Date(Date.now() - 86400000).toDateString();

			let newStreak = prev.currentStreak;
			if (prev.lastPracticeDate === yesterday) {
				newStreak = prev.currentStreak + 1;
			} else if (prev.lastPracticeDate !== today) {
				newStreak = 1;
			}

			const updatedMilestones = prev.streakMilestones.map((milestone) => ({
				...milestone,
				unlocked: milestone.unlocked || newStreak >= milestone.streak,
			}));

			const newData = {
				...prev,
				currentStreak: newStreak,
				lastPracticeDate: today,
				streakMilestones: updatedMilestones,
			};
			saveGamification(newData);
			return newData;
		});
	}, []);

	const completeDailyChallenge = useCallback((challengeId: string) => {
		setData((prev) => {
			const challenge = prev.dailyChallenges.find((c) => c.id === challengeId);
			if (!challenge || challenge.completed) return prev;

			const updatedChallenges = prev.dailyChallenges.map((c) =>
				c.id === challengeId
					? { ...c, completed: true, progress: c.target }
					: c,
			);

			const newData = {
				...prev,
				xp: prev.xp + challenge.xpReward,
				totalXp: prev.totalXp + challenge.xpReward,
				dailyChallenges: updatedChallenges,
			};
			saveGamification(newData);
			return newData;
		});
	}, []);

	return {
		gamification,
		levelInfo,
		isLoaded,
		addXp,
		addAchievement,
		checkAndUnlockAchievements,
		updateStreak,
		completeDailyChallenge,
		currentStreak: data.currentStreak,
	};
}
