export type Rarity = "common" | "rare" | "epic" | "legendary";

export const rarityColors: Record<Rarity, string> = {
	common: "bg-muted border-border",
	rare: "bg-[--system-accent]/10 border-[--system-accent]/20",
	epic: "bg-accent/10 border-accent/30",
	legendary: "bg-warning/10 border-warning/30",
};

export const rarityGlow: Record<Rarity, string> = {
	common: "",
	rare: "shadow-level-1",
	epic: "shadow-accent/20",
	legendary: "shadow-warning/30",
};

export const raritySolid: Record<Rarity, string> = {
	common: "bg-muted",
	rare: "bg-[--system-accent]",
	epic: "bg-accent dark:bg-accent/70",
	legendary: "bg-warning dark:bg-warning/70",
};

export const rarityBorder: Record<Rarity, string> = {
	common: "border-border",
	rare: "border-[--system-accent]",
	epic: "border-accent dark:border-accent/70",
	legendary: "border-warning dark:border-warning/70",
};

export const rarityGlowStrong: Record<Rarity, string> = {
	common: "shadow-gray-500/50 dark:shadow-gray-700/50",
	rare: "shadow-level-2",
	epic: "shadow-accent/50 dark:shadow-accent/50",
	legendary: "shadow-warning/70 dark:shadow-warning/70",
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
	.sort((a, b) => b - a);

export function getStreakMessage(streak: number): string {
	if (streak <= 0) return "Start your streak!";
	for (const threshold of streakThresholds) {
		if (streak >= threshold) return streakMessages[threshold];
	}
	return "Keep going!";
}
