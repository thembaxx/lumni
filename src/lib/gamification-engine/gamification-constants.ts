export type Rarity = "common" | "rare" | "epic" | "legendary";

export const rarityColors: Record<Rarity, string> = {
  common: "bg-muted border-border",
  rare: "bg-(--system-accent)/10 border-(--system-accent)/20",
  epic: "bg-(--system-accent)/20 border-(--system-accent)/30",
  legendary: "bg-(--system-destructive)/10 border-(--system-destructive)/30",
};

export const rarityGlow: Record<Rarity, string> = {
  common: "",
  rare: "shadow-level-1",
  epic: "shadow-(--system-accent)/20",
  legendary: "shadow-(--system-destructive)/30",
};

export const raritySolid: Record<Rarity, string> = {
  common: "bg-muted",
  rare: "bg-(--system-accent)",
  epic: "bg-(--system-accent) dark:bg-(--system-accent)/70",
  legendary: "bg-(--system-destructive) dark:bg-(--system-destructive)/70",
};

export const rarityBorder: Record<Rarity, string> = {
  common: "border-border",
  rare: "border-(--system-accent)",
  epic: "border-(--system-accent) dark:border-(--system-accent)/70",
  legendary: "border-(--system-destructive) dark:border-(--system-destructive)/70",
};

export const rarityGlowStrong: Record<Rarity, string> = {
  common: "shadow-gray-500/50 dark:shadow-gray-700/50",
  rare: "shadow-level-2",
  epic: "shadow-(--system-accent)/50 dark:shadow-(--system-accent)/50",
  legendary: "shadow-(--system-destructive)/70 dark:shadow-(--system-destructive)/70",
};

const streakMessages: Record<number, string> = {
  1: "Keep it up!",
  3: "On Fire!",
  7: "Week Warrior!",
  14: "Unstoppable!",
  30: "Legendary!",
  60: "Grandmaster!",
  100: "Lumni Legend!",
};

const streakThresholds = Object.keys(streakMessages)
  .map(Number)
  .toSorted((a, b) => b - a);

export function getStreakMessage(streak: number): string {
  if (streak <= 0) return "Start your streak!";
  for (const threshold of streakThresholds) {
    if (streak >= threshold) return streakMessages[threshold];
  }
  return "Keep going!";
}
