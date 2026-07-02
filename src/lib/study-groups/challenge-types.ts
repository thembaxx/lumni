export type ChallengeStatus = "active" | "completed";
export type BadgeTier = "bronze" | "silver" | "gold";
export type ChallengeType = "most-quizzes" | "highest-accuracy" | "most-flashcards";

export interface GroupChallenge {
  $id: string;
  groupId: string;
  weekStart: string;
  weekEnd: string;
  status: ChallengeStatus;
  challengeType: ChallengeType;
  createdAt: string;
}

export const CHALLENGE_TYPE_LABELS: Record<ChallengeType, string> = {
  "most-quizzes": "Most Quizzes Completed",
  "highest-accuracy": "Highest Accuracy",
  "most-flashcards": "Most Flashcards Reviewed",
};

export const CHALLENGE_TYPE_ICONS: Record<ChallengeType, string> = {
  "most-quizzes": "File02Icon",
  "highest-accuracy": "Target01Icon",
  "most-flashcards": "CardIcon",
};

export interface GroupChallengeEntry {
  $id: string;
  challengeId: string;
  groupId: string;
  userId: string;
  xpEarned: number;
  questionsAnswered: number;
  accuracy: number;
  combinedScore: number;
  updatedAt: string;
}

export interface GroupBadge {
  $id: string;
  groupId: string;
  userId: string;
  name: string;
  description: string;
  icon: string;
  tier: BadgeTier;
  earnedAt: string;
}

export const BADGE_DEFS = [
  {
    name: "Challenge Champion",
    description: "1st place in weekly challenge",
    icon: "MedalFirstPlaceIcon",
    tier: "gold" as BadgeTier,
  },
  {
    name: "Challenge Runner-Up",
    description: "2nd place in weekly challenge",
    icon: "MedalSecondPlaceIcon",
    tier: "silver" as BadgeTier,
  },
  {
    name: "Challenge Third",
    description: "3rd place in weekly challenge",
    icon: "MedalThirdPlaceIcon",
    tier: "bronze" as BadgeTier,
  },
  {
    name: "Group Champions",
    description: "Winning group of the week",
    icon: "Award01Icon",
    tier: "gold" as BadgeTier,
  },
  {
    name: "Group Runners-Up",
    description: "Second-place group of the week",
    icon: "Award02Icon",
    tier: "silver" as BadgeTier,
  },
  {
    name: "Group Third Place",
    description: "Third-place group of the week",
    icon: "Award03Icon",
    tier: "bronze" as BadgeTier,
  },
];

export function getWeekRange(): { start: string; end: string } {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday.toISOString(), end: sunday.toISOString() };
}
