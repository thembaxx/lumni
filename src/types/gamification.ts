import type { DailyChallenge, LevelInfo } from "./gamification-types";
export type {
  Achievement,
  DailyChallenge,
  LevelInfo,
  RewardChestDef,
  StreakMilestone,
  UserGamification,
} from "./gamification-types";
export { XP_PER_CORRECT, XP_PER_QUESTION, XP_STREAK_BONUS, LEVELS } from "./gamification-types";
export { ACHIEVEMENTS, REWARD_CHESTS, STREAK_MILESTONES } from "./gamification-data";

import { LEVELS } from "./gamification-types";

const XP_DAILY_COMPLETE = 50;

export function calculateLevel(totalXp: number): LevelInfo {
  let currentLevel = LEVELS[0];
  let nextLevel = LEVELS[1];

  for (let i = 0; i < LEVELS.length - 1; i++) {
    if (totalXp >= LEVELS[i].xpRequired && totalXp < LEVELS[i + 1].xpRequired) {
      currentLevel = LEVELS[i];
      nextLevel = LEVELS[i + 1];
      break;
    }
    if (totalXp >= LEVELS[LEVELS.length - 1].xpRequired) {
      currentLevel = LEVELS[LEVELS.length - 1];
      nextLevel = LEVELS[LEVELS.length - 1];
    }
  }

  const xpInCurrentLevel = totalXp - currentLevel.xpRequired;
  const xpNeeded = nextLevel.xpRequired - currentLevel.xpRequired;
  const progress =
    nextLevel.level === currentLevel.level ? 100 : (xpInCurrentLevel / xpNeeded) * 100;

  return {
    level: currentLevel.level,
    currentXp: xpInCurrentLevel,
    xpToNextLevel: xpNeeded,
    progress: Math.min(progress, 100),
    title: currentLevel.title,
  };
}

export function generateDailyChallenges(): DailyChallenge[] {
  const today = new Date().toDateString();
  const challenges: DailyChallenge[] = [
    {
      id: "daily_questions",
      title: "Daily Grind",
      description: "Answer 10 questions today",
      icon: "File02Icon",
      xpReward: XP_DAILY_COMPLETE,
      target: 10,
      progress: 0,
      completed: false,
      expiresAt: today,
      type: "questions",
    },
    {
      id: "daily_accuracy",
      title: "Precision",
      description: "Achieve 70% accuracy in a session",
      icon: "Target01Icon",
      xpReward: 40,
      target: 70,
      progress: 0,
      completed: false,
      expiresAt: today,
      type: "accuracy",
    },
    {
      id: "daily_streak",
      title: "Keep the Flame",
      description: "Practice on consecutive days",
      icon: "FireIcon",
      xpReward: 30,
      target: 2,
      progress: 1,
      completed: false,
      expiresAt: today,
      type: "streak",
    },
  ];

  return challenges;
}
