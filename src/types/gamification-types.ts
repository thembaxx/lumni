export interface UserGamification {
  xp: number;
  level: number;
  totalXp: number;
  achievements: Achievement[];
  dailyChallenges: DailyChallenge[];
  streakMilestones: StreakMilestone[];
  lastPracticeDate: string | null;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string | null;
  xpReward: number;
  rarity: "common" | "rare" | "epic" | "legendary";
  category: "streak" | "accuracy" | "volume" | "subject" | "special";
  requirement: number;
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  target: number;
  progress: number;
  completed: boolean;
  expiresAt: string;
  type: "questions" | "accuracy" | "streak" | "subject";
}

export interface StreakMilestone {
  streak: number;
  reward: string;
  unlocked: boolean;
}

export interface LevelInfo {
  level: number;
  currentXp: number;
  xpToNextLevel: number;
  progress: number;
  title: string;
}

export interface RewardChestDef {
  id: string;
  name: string;
  description: string;
  xpRequired: number;
  xpReward: number;
  icon: string;
  rarity: "common" | "rare" | "epic" | "legendary";
}

export const XP_PER_QUESTION = 10;
export const XP_PER_CORRECT = 5;
export const XP_STREAK_BONUS = 20;
export const LEVELS = [
  { level: 1, title: "Beginner", xpRequired: 0 },
  { level: 2, title: "Learner", xpRequired: 100 },
  { level: 3, title: "Student", xpRequired: 250 },
  { level: 4, title: "Scholar", xpRequired: 500 },
  { level: 5, title: "Acolyte", xpRequired: 850 },
  { level: 6, title: "Expert", xpRequired: 1200 },
  { level: 7, title: "Master", xpRequired: 1700 },
  { level: 8, title: "Sage", xpRequired: 2300 },
  { level: 9, title: "Virtuoso", xpRequired: 3000 },
  { level: 10, title: "Champion", xpRequired: 3800 },
  { level: 11, title: "Legend", xpRequired: 4700 },
  { level: 12, title: "Grandmaster", xpRequired: 5700 },
];
