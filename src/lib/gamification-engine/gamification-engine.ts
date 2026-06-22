import { logError } from "@/lib/shared/logger";
import type { RewardChestDef } from "@/types/gamification";
import {
  ACHIEVEMENTS,
  calculateLevel,
  generateDailyChallenges,
  REWARD_CHESTS,
  STREAK_MILESTONES as STREAK_MILESTONE_DEFS,
  XP_PER_CORRECT,
  XP_PER_QUESTION,
  XP_STREAK_BONUS,
} from "@/types/gamification";
import type { StoredAchievement, StoredGamification } from "./types";

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
  subjectQuestionCounts: {},
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

  resetExpiredChallenges(
    dailyChallenges: StoredGamification["dailyChallenges"],
  ): StoredGamification["dailyChallenges"] {
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

  mergeWithDefaults(stored: StoredGamification): StoredGamification {
    const challenges = this.resetExpiredChallenges(stored.dailyChallenges);
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

    let bonusXp = 0;
    const updatedChallenges = data.dailyChallenges.map((challenge) => {
      if (challenge.completed) return challenge;
      let updated: typeof challenge;
      switch (challenge.type) {
        case "questions": {
          const newProgress = Math.min(challenge.progress + amount, challenge.target);
          updated = {
            ...challenge,
            progress: newProgress,
            completed: newProgress >= challenge.target,
          };
          break;
        }
        case "accuracy":
          if (accuracy > challenge.progress) {
            updated = {
              ...challenge,
              progress: accuracy,
              completed: accuracy >= challenge.target,
            };
          } else {
            updated = challenge;
          }
          break;
        case "streak":
          if (streak >= challenge.target) {
            updated = { ...challenge, progress: streak, completed: true };
          } else {
            updated = {
              ...challenge,
              progress: Math.max(challenge.progress, streak),
            };
          }
          break;
        case "subject":
          if (subject && challenge.title.toLowerCase().includes(subject.toLowerCase())) {
            updated = { ...challenge, progress: 1, completed: true };
          } else {
            updated = challenge;
          }
          break;
        default:
          updated = challenge;
      }
      if (updated.completed && !challenge.completed) {
        bonusXp += challenge.xpReward;
      }
      return updated;
    });

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

  checkAndUnlockAchievements(
    data: StoredGamification,
    questionsAnswered: number,
    accuracy: number,
    streak: number,
    currentLevel: number,
    perfectQuiz: boolean,
  ): string[] {
    const newAchievements: string[] = [];
    const earned = data.achievements.map((a) => a.id);

    const checks: [string, boolean][] = [
      ["first_question", questionsAnswered >= 1 && !earned.includes("first_question")],
      ["streak_3", streak >= 3 && !earned.includes("streak_3")],
      ["streak_7", streak >= 7 && !earned.includes("streak_7")],
      ["streak_30", streak >= 30 && !earned.includes("streak_30")],
      ["questions_50", questionsAnswered >= 50 && !earned.includes("questions_50")],
      ["questions_100", questionsAnswered >= 100 && !earned.includes("questions_100")],
      ["questions_500", questionsAnswered >= 500 && !earned.includes("questions_500")],
      ["accuracy_80", accuracy >= 80 && !earned.includes("accuracy_80")],
      ["accuracy_90", accuracy >= 90 && !earned.includes("accuracy_90")],
      ["perfect_quiz", perfectQuiz && !earned.includes("perfect_quiz")],
      ["level_5", currentLevel >= 5 && !earned.includes("level_5")],
      ["level_10", currentLevel >= 10 && !earned.includes("level_10")],
    ];

    const subjectCounts = data.subjectQuestionCounts;
    const subjectsWithActivity = Object.keys(subjectCounts).filter(
      (s) => subjectCounts[s] > 0,
    ).length;

    const subjectChecks: [string, boolean][] = [
      [
        "subject_math_50",
        (subjectCounts.mathematics ?? 0) >= 50 && !earned.includes("subject_math_50"),
      ],
      [
        "subject_math_200",
        (subjectCounts.mathematics ?? 0) >= 200 && !earned.includes("subject_math_200"),
      ],
      [
        "subject_science_50",
        (subjectCounts.physical_sciences ?? 0) >= 50 && !earned.includes("subject_science_50"),
      ],
      [
        "subject_science_200",
        (subjectCounts.physical_sciences ?? 0) >= 200 && !earned.includes("subject_science_200"),
      ],
      [
        "subject_language_50",
        (subjectCounts.english ?? 0) >= 50 && !earned.includes("subject_language_50"),
      ],
      [
        "subject_language_200",
        (subjectCounts.english ?? 0) >= 200 && !earned.includes("subject_language_200"),
      ],
      [
        "subject_commerce_50",
        (subjectCounts.accounting ?? 0) >= 50 && !earned.includes("subject_commerce_50"),
      ],
      [
        "subject_commerce_200",
        (subjectCounts.accounting ?? 0) >= 200 && !earned.includes("subject_commerce_200"),
      ],
      ["subjects_all_5", subjectsWithActivity >= 5 && !earned.includes("subjects_all_5")],
    ];

    for (const [id, shouldUnlock] of [...checks, ...subjectChecks]) {
      if (shouldUnlock) newAchievements.push(id);
    }

    return newAchievements;
  }

  updateStreak(data: StoredGamification): {
    data: StoredGamification;
    milestoneXpGained: number;
    freezeConsumed: boolean;
  } {
    const today = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    let freezeConsumed = false;
    let newStreak = data.currentStreak;
    let newStreakFreezes = data.streakFreezes;

    if (data.lastPracticeDate === yesterdayStr) {
      newStreak = data.currentStreak + 1;
    } else if (data.lastPracticeDate !== today) {
      if (data.currentStreak > 1 && data.streakFreezes > 0) {
        newStreakFreezes -= 1;
        freezeConsumed = true;
      } else {
        newStreak = 1;
      }
    }

    let milestoneXpGain = 0;
    let milestoneFreezeGain = 0;
    const updatedMilestones = data.streakMilestones.map((ms) => {
      if (!ms.unlocked && newStreak >= ms.streak) {
        const reward = this.getStreakXpReward(ms.streak);
        milestoneXpGain += reward;
        milestoneFreezeGain += 1;
        return { ...ms, unlocked: true };
      }
      return ms;
    });

    return {
      data: {
        ...data,
        currentStreak: newStreak,
        lastPracticeDate: today,
        streakFreezes: newStreakFreezes + milestoneFreezeGain,
        xp: data.xp + milestoneXpGain,
        totalXp: data.totalXp + milestoneXpGain,
        streakMilestones: updatedMilestones,
      },
      milestoneXpGained: milestoneXpGain,
      freezeConsumed,
    };
  }

  consumeStreakFreeze(data: StoredGamification): {
    data: StoredGamification;
    success: boolean;
  } {
    if (data.streakFreezes <= 0) return { data, success: false };
    return {
      data: { ...data, streakFreezes: data.streakFreezes - 1 },
      success: true,
    };
  }

  addStreakFreeze(data: StoredGamification, count: number = 1): StoredGamification {
    return { ...data, streakFreezes: data.streakFreezes + count };
  }

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

  completeDailyChallenge(
    data: StoredGamification,
    challengeId: string,
  ): { data: StoredGamification; xpReward: number } {
    const challenge = data.dailyChallenges.find((c) => c.id === challengeId);
    if (!challenge || challenge.completed) {
      return { data, xpReward: 0 };
    }

    const updatedChallenges = data.dailyChallenges.map((c) =>
      c.id === challengeId ? { ...c, completed: true, progress: c.target } : c,
    );

    return {
      data: {
        ...data,
        xp: data.xp + challenge.xpReward,
        totalXp: data.totalXp + challenge.xpReward,
        dailyChallenges: updatedChallenges,
      },
      xpReward: challenge.xpReward,
    };
  }

  getStreakXpReward(streak: number): number {
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
  }

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
