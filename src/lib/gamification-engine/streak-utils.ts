import type { StoredGamification } from "./types";

export function updateStreak(data: StoredGamification): {
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
      const reward = getStreakXpReward(ms.streak);
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

export function consumeStreakFreeze(data: StoredGamification): {
  data: StoredGamification;
  success: boolean;
} {
  if (data.streakFreezes <= 0) return { data, success: false };
  return {
    data: { ...data, streakFreezes: data.streakFreezes - 1 },
    success: true,
  };
}

export function addStreakFreeze(data: StoredGamification, count: number = 1): StoredGamification {
  return { ...data, streakFreezes: data.streakFreezes + count };
}

export function getStreakXpReward(streak: number): number {
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
