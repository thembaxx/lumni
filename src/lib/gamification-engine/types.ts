import type { DailyChallenge, StreakMilestone } from "@/types/gamification";

export interface StoredAchievement {
  id: string;
  earnedAt: string;
}

/** Storage-facing gamification shape. Uses StoredAchievement[] (id+earnedAt only) for
    compact localStorage serialization. Intentionally differs from UserGamification
    (types/gamification.ts) which uses full Achievement[] enriched with definition data
    for the UI layer. The use-gamification hook bridges the two. */
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
  streakFreezes: number;
  streakFreezeUsedToday: boolean;
  freezeEvents: { date: string; streakProtected: number; freezesRemaining: number }[];
  subjectQuestionCounts: Record<string, number>;
  consecutiveCorrectFlashcards?: number;
  wrongAnswersReviewed?: number;
  studyPlanDaysCompleted?: number;
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

export interface StoredRewardChest {
  id: string;
  claimedAt: string | null;
}
