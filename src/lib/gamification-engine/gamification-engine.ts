import { logError } from "@/lib/shared/logger";
import type { RewardChestDef } from "@/types/gamification";
import {
  calculateLevel,
  generateDailyChallenges,
  REWARD_CHESTS,
  STREAK_MILESTONES as STREAK_MILESTONE_DEFS,
  XP_PER_CORRECT,
  XP_PER_QUESTION,
  XP_STREAK_BONUS,
} from "@/types/gamification";
import { ACHIEVEMENTS } from "@/types/gamification";
import type { StoredAchievement, StoredGamification } from "./types";
import { checkAndUnlockAchievements } from "./achievement-checks";
import {
  resetExpiredChallenges,
  updateChallengesInAddXp,
  completeDailyChallenge,
} from "./daily-challenge-utils";
import { updateStreak, consumeStreakFreeze, addStreakFreeze, addWeeklyFreeze } from "./streak-utils";

const GAMIFICATION_KEY = "lumni_gamification";

const DEFAULT_GAMIFICATION: StoredGamification = {
  xp: 0,
  totalXp: 0,
  achievements: [],
  dailyChallenges: generateDailyChallenges(),
  streakMilestones: STREAK_MILESTONE_DEFS.map((s) => ({
    ...s,
    unlocked: false,
  })),
  lastPracticeDate: null,
  currentStreak: 0,
  totalQuestionsAnswered: 0,
  claimedChests: [],
  streakFreezes: 3,
  streakFreezeUsedToday: false,
  freezeEvents: [],
  subjectQuestionCounts: {},
  consecutiveCorrectFlashcards: 0,
  wrongAnswersReviewed: 0,
  studyPlanDaysCompleted: 0,
};

export class GamificationEngine {
  private _saveTimer: ReturnType<typeof setTimeout> | null = null;

  load(): StoredGamification {
    if (typeof window === "undefined") return DEFAULT_GAMIFICATION;
    try {
      const stored = localStorage.getItem(GAMIFICATION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as StoredGamification;
        if (
          Array.isArray(parsed.achievements) &&
          parsed.achievements.length > 0 &&
          typeof parsed.achievements[0] === "string"
        ) {
          parsed.achievements = (parsed.achievements as unknown as string[]).map((id: string) => ({
            id,
            earnedAt: new Date(0).toISOString(),
          }));
        }
        return this.mergeWithDefaults(parsed);
      }
    } catch (err) {
      logError("GamificationEngine", err);
      // ignore
    }
    return DEFAULT_GAMIFICATION;
  }

  save(data: StoredGamification): void {
    if (typeof window === "undefined") return;
    if (this._saveTimer) clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(GAMIFICATION_KEY, JSON.stringify(data));
      } catch (err) {
        logError("GamificationEngine", err);
        // ignore
      }
    }, 0);
  }

  mergeWithDefaults(stored: StoredGamification): StoredGamification {
    const challenges = resetExpiredChallenges(stored.dailyChallenges);
    return { ...DEFAULT_GAMIFICATION, ...stored, dailyChallenges: challenges };
  }

  addXp(
    data: StoredGamification,
    amount: number,
    accuracy: number,
    streak: number,
    subject?: string,
  ): { data: StoredGamification; leveledUp: number | null; xpGained: number } {
    const isCorrect = accuracy >= 50;
    const baseXp = XP_PER_QUESTION + (isCorrect ? XP_PER_CORRECT : 0);
    const streakBonus = streak > 1 ? XP_STREAK_BONUS : 0;
    const totalXpGain = amount * baseXp + streakBonus;

    const newTotalXp = data.totalXp + totalXpGain;
    const newXp = data.xp + totalXpGain;

    const oldLevel = calculateLevel(data.totalXp).level;
    const newLevelInfo = calculateLevel(newTotalXp);
    const leveledUp = newLevelInfo.level > oldLevel ? newLevelInfo.level : null;

    const { data: challengeData, bonusXp } = updateChallengesInAddXp(
      data,
      amount,
      accuracy,
      streak,
      subject,
    );
    const updatedChallenges = challengeData.dailyChallenges;

    return {
      data: {
        ...data,
        xp: newXp + bonusXp,
        totalXp: newTotalXp + bonusXp,
        totalQuestionsAnswered: data.totalQuestionsAnswered + amount,
        dailyChallenges: updatedChallenges,
      },
      leveledUp,
      xpGained: totalXpGain + bonusXp,
    };
  }

  addAchievement(
    data: StoredGamification,
    achievementId: string,
  ): {
    data: StoredGamification;
    achievement: (typeof ACHIEVEMENTS)[number] | null;
  } {
    if (data.achievements.some((a) => a.id === achievementId)) {
      return { data, achievement: null };
    }

    const achievement = ACHIEVEMENTS.find((a) => a.id === achievementId);
    if (!achievement) return { data, achievement: null };

    const newAchievements: StoredAchievement[] = [
      ...data.achievements,
      { id: achievementId, earnedAt: new Date().toISOString() },
    ];
    const newTotalXp = data.totalXp + achievement.xpReward;

    return {
      data: {
        ...data,
        achievements: newAchievements,
        totalXp: newTotalXp,
        xp: data.xp + achievement.xpReward,
      },
      achievement,
    };
  }

  checkAndUnlockAchievements = checkAndUnlockAchievements;
  updateStreak = updateStreak;
  consumeStreakFreeze = consumeStreakFreeze;
  addStreakFreeze = addStreakFreeze;
  addWeeklyFreeze = addWeeklyFreeze;

  trackSubjectQuestion(
    data: StoredGamification,
    subject: string,
    count: number = 1,
  ): StoredGamification {
    const normalized = subject.toLowerCase().replace(/[^a-z]/g, "_");
    const current = data.subjectQuestionCounts[normalized] ?? 0;
    return {
      ...data,
      subjectQuestionCounts: {
        ...data.subjectQuestionCounts,
        [normalized]: current + count,
      },
    };
  }

  completeDailyChallenge = completeDailyChallenge;

  checkAndClaimRewardChest(data: StoredGamification): {
    data: StoredGamification;
    chest: RewardChestDef | null;
  } {
    const claimedIds = new Set(data.claimedChests.map((c) => c.id));
    for (const chest of REWARD_CHESTS) {
      if (!claimedIds.has(chest.id) && data.totalXp >= chest.xpRequired) {
        return {
          data: {
            ...data,
            xp: data.xp + chest.xpReward,
            totalXp: data.totalXp + chest.xpReward,
            claimedChests: [
              ...data.claimedChests,
              { id: chest.id, claimedAt: new Date().toISOString() },
            ],
          },
          chest,
        };
      }
    }
    return { data, chest: null };
  }
}

export const gamificationEngine = new GamificationEngine();
