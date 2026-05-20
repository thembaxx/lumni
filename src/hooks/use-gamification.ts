"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "@/components/ui/toast";
import type { Achievement, LevelInfo } from "@/types/gamification";
import {
	ACHIEVEMENTS,
	calculateLevel,
	type DailyChallenge,
	generateDailyChallenges,
	STREAK_MILESTONES,
	type UserGamification,
	XP_PER_CORRECT,
	XP_PER_QUESTION,
	XP_STREAK_BONUS,
} from "@/types/gamification";

const GAMIFICATION_KEY = "lumni_gamification";

interface StoredAchievement {
	id: string;
	earnedAt: string;
}

interface StoredGamification {
	xp: number;
	totalXp: number;
	achievements: StoredAchievement[];
	dailyChallenges: DailyChallenge[];
	streakMilestones: StreakMilestone[];
	lastPracticeDate: string | null;
	currentStreak: number;
	totalQuestionsAnswered: number;
}

interface StreakMilestone {
	streak: number;
	reward: string;
	unlocked: boolean;
}

const DEFAULT_GAMIFICATION: StoredGamification = {
	xp: 0,
	totalXp: 0,
	achievements: [] as StoredAchievement[],
	dailyChallenges: generateDailyChallenges(),
	streakMilestones: STREAK_MILESTONES.map((s) => ({ ...s })),
	lastPracticeDate: null,
	currentStreak: 0,
	totalQuestionsAnswered: 0,
};

function loadFromStorage(): StoredGamification {
	try {
		const stored = localStorage.getItem(GAMIFICATION_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			if (
				Array.isArray(parsed.achievements) &&
				parsed.achievements.length > 0 &&
				typeof parsed.achievements[0] === "string"
			) {
				parsed.achievements = parsed.achievements.map((id: string) => ({
					id,
					earnedAt: new Date(0).toISOString(),
				}));
			}
			return parsed;
		}
	} catch (e) {
		console.warn("Failed to load gamification data:", e);
	}
	return DEFAULT_GAMIFICATION;
}

function saveToStorage(data: StoredGamification) {
	localStorage.setItem(GAMIFICATION_KEY, JSON.stringify(data));
}

function resetExpiredChallenges(
	dailyChallenges: DailyChallenge[],
): DailyChallenge[] {
	const today = new Date().toDateString();
	return dailyChallenges.map((challenge) => {
		if (challenge.expiresAt !== today) {
			return { ...challenge, progress: 0, completed: false, expiresAt: today };
		}
		return challenge;
	});
}

function mergeWithDefaults(stored: StoredGamification): StoredGamification {
	const challenges = resetExpiredChallenges(stored.dailyChallenges);
	return { ...DEFAULT_GAMIFICATION, ...stored, dailyChallenges: challenges };
}

export function useGamification() {
	const [data, setData] = useState<StoredGamification>(DEFAULT_GAMIFICATION);
	const prevLevelRef = useRef<number>(0);
	const [leveledUp, setLeveledUp] = useState<LevelInfo | null>(null);
	const [pendingAchievement, setPendingAchievement] =
		useState<Achievement | null>(null);

	useEffect(() => {
		const stored = loadFromStorage();
		const merged = mergeWithDefaults(stored);
		if (merged !== DEFAULT_GAMIFICATION) {
			saveToStorage(merged);
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
				const isCorrect = accuracy >= 50;
				const baseXp = XP_PER_QUESTION + (isCorrect ? XP_PER_CORRECT : 0);
				const streakBonus = streak > 1 ? XP_STREAK_BONUS : 0;
				const totalXpGain = amount * baseXp + streakBonus;

				const newTotalXp = prev.totalXp + totalXpGain;
				const newXp = prev.xp + totalXpGain;

				const oldLevel = prevLevelRef.current;
				const newLevelInfo = calculateLevel(newTotalXp);
				if (newLevelInfo.level > oldLevel) {
					setLeveledUp(newLevelInfo);
					prevLevelRef.current = newLevelInfo.level;
				}

				const updatedChallenges = prev.dailyChallenges.map((challenge) => {
					if (challenge.completed) return challenge;
					switch (challenge.type) {
						case "questions":
							return {
								...challenge,
								progress: Math.min(
									challenge.progress + amount,
									challenge.target,
								),
								completed: challenge.progress + amount >= challenge.target,
							};
						case "accuracy":
							if (accuracy > challenge.progress) {
								return {
									...challenge,
									progress: accuracy,
									completed: accuracy >= challenge.target,
								};
							}
							return challenge;
						case "streak":
							if (streak >= challenge.target) {
								return { ...challenge, progress: streak, completed: true };
							}
							return {
								...challenge,
								progress: Math.max(challenge.progress, streak),
							};
						case "subject":
							if (
								subject &&
								challenge.title.toLowerCase().includes(subject.toLowerCase())
							) {
								return { ...challenge, progress: 1, completed: true };
							}
							return challenge;
						default:
							return challenge;
					}
				});

				const newData = {
					...prev,
					xp: newXp,
					totalXp: newTotalXp,
					totalQuestionsAnswered: prev.totalQuestionsAnswered + amount,
					dailyChallenges: updatedChallenges,
				};
				saveToStorage(newData);
				return newData;
			});
		},
		[],
	);

	const addAchievement = useCallback((achievementId: string) => {
		setData((prev) => {
			if (prev.achievements.some((a) => a.id === achievementId)) return prev;

			const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId);
			if (!achievement) return prev;

			const newAchievements = [
				...prev.achievements,
				{ id: achievementId, earnedAt: new Date().toISOString() },
			];
			const newTotalXp = prev.totalXp + achievement.xpReward;

			const newData = {
				...prev,
				achievements: newAchievements,
				totalXp: newTotalXp,
				xp: prev.xp + achievement.xpReward,
			};

			setPendingAchievement(achievement);

			setTimeout(() => {
				toast({
					type: "success",
					message: `${achievement.icon} New Achievement: ${achievement.name}`,
					description: achievement.description,
					duration: 5000,
				});
			}, 0);

			saveToStorage(newData);
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
				!data.achievements.some((a) => a.id === "first_question")
			) {
				newAchievements.push("first_question");
			}
			if (streak >= 3 && !data.achievements.some((a) => a.id === "streak_3")) {
				newAchievements.push("streak_3");
			}
			if (streak >= 7 && !data.achievements.some((a) => a.id === "streak_7")) {
				newAchievements.push("streak_7");
			}
			if (
				streak >= 30 &&
				!data.achievements.some((a) => a.id === "streak_30")
			) {
				newAchievements.push("streak_30");
			}
			if (
				questionsAnswered >= 50 &&
				!data.achievements.some((a) => a.id === "questions_50")
			) {
				newAchievements.push("questions_50");
			}
			if (
				questionsAnswered >= 100 &&
				!data.achievements.some((a) => a.id === "questions_100")
			) {
				newAchievements.push("questions_100");
			}
			if (
				questionsAnswered >= 500 &&
				!data.achievements.some((a) => a.id === "questions_500")
			) {
				newAchievements.push("questions_500");
			}
			if (
				accuracy >= 80 &&
				!data.achievements.some((a) => a.id === "accuracy_80")
			) {
				newAchievements.push("accuracy_80");
			}
			if (
				accuracy >= 90 &&
				!data.achievements.some((a) => a.id === "accuracy_90")
			) {
				newAchievements.push("accuracy_90");
			}
			if (
				perfectQuiz &&
				!data.achievements.some((a) => a.id === "perfect_quiz")
			) {
				newAchievements.push("perfect_quiz");
			}
			if (
				currentLevel >= 5 &&
				!data.achievements.some((a) => a.id === "level_5")
			) {
				newAchievements.push("level_5");
			}
			if (
				currentLevel >= 10 &&
				!data.achievements.some((a) => a.id === "level_10")
			) {
				newAchievements.push("level_10");
			}

			newAchievements.forEach((id) => {
				addAchievement(id);
			});
		},
		[data.achievements, addAchievement],
	);

	const streakXpReward = useCallback((streak: number): number => {
		switch (streak) {
			case 3:
				return 50;
			case 7:
				return 100;
			case 14:
				return 150;
			case 30:
				return 200;
			case 60:
				return 300;
			case 100:
				return 500;
			default:
				return 0;
		}
	}, []);

	const updateStreak = useCallback(() => {
		setData((prev) => {
			const today = new Date().toDateString();
			const yesterday = new Date();
			yesterday.setDate(yesterday.getDate() - 1);
			const yesterdayStr = yesterday.toDateString();

			let newStreak = prev.currentStreak;
			if (prev.lastPracticeDate === yesterdayStr) {
				newStreak = prev.currentStreak + 1;
			} else if (prev.lastPracticeDate !== today) {
				newStreak = 1;
			}

			let milestoneXpGain = 0;
			const updatedMilestones = prev.streakMilestones.map((milestone) => {
				if (!milestone.unlocked && newStreak >= milestone.streak) {
					milestoneXpGain += streakXpReward(milestone.streak);
					return { ...milestone, unlocked: true };
				}
				return milestone;
			});

			const newData = {
				...prev,
				currentStreak: newStreak,
				lastPracticeDate: today,
				xp: prev.xp + milestoneXpGain,
				totalXp: prev.totalXp + milestoneXpGain,
				streakMilestones: updatedMilestones,
			};
			saveToStorage(newData);
			return newData;
		});
	}, [streakXpReward]);

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
			saveToStorage(newData);
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
