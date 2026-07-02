import type { StoredGamification, StoredGamification as S } from "./types";

export function resetExpiredChallenges(
  dailyChallenges: S["dailyChallenges"],
): S["dailyChallenges"] {
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

export function updateChallengesInAddXp(
  data: StoredGamification,
  amount: number,
  accuracy: number,
  streak: number,
  subject?: string,
): { data: StoredGamification; bonusXp: number } {
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

  return { data: { ...data, dailyChallenges: updatedChallenges }, bonusXp };
}

export function completeDailyChallenge(
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
