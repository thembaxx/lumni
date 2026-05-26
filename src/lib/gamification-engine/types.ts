import type { DailyChallenge } from "@/types/gamification";

export interface StoredAchievement {
	id: string;
	earnedAt: string;
}

export interface StreakMilestone {
	streak: number;
	reward: string;
	unlocked: boolean;
}

export interface StoredGamification {
	xp: number;
	totalXp: number;
	achievements: StoredAchievement[];
	dailyChallenges: DailyChallenge[];
	streakMilestones: StreakMilestone[];
	lastPracticeDate: string | null;
	currentStreak: number;
	totalQuestionsAnswered: number;
	claimedChests: StoredRewardChest[];
}

export interface GamificationResult {
	xpAwarded: number;
	newLevel: number | null;
	newStreak: number;
	unlockedAchievements: string[];
}

export interface AchievementCheckResult {
	unlocked: string[];
	pending: string[];
}

export interface RewardChest {
	id: string;
	name: string;
	description: string;
	xpRequired: number;
	xpReward: number;
	icon: string;
	rarity: "common" | "rare" | "epic" | "legendary";
}

export interface StoredRewardChest {
	id: string;
	claimedAt: string | null;
}
