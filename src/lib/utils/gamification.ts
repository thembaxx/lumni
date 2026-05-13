export type Rarity = "common" | "rare" | "epic" | "legendary";

export const rarityColors: Record<Rarity, string> = {
	common: "bg-muted border-border",
	rare: "bg-[--system-accent]/10 border-[--system-accent]/20",
	epic: "bg-purple-500/10 border-purple-500/30",
	legendary: "bg-amber-500/10 border-amber-500/30",
};

export const rarityGlow: Record<Rarity, string> = {
	common: "",
	rare: "shadow-[--system-accent]/20",
	epic: "shadow-purple-500/20",
	legendary: "shadow-amber-500/30",
};

export const raritySolid: Record<Rarity, string> = {
	common: "bg-muted",
	rare: "bg-[--system-accent]",
	epic: "bg-purple-500 dark:bg-purple-700",
	legendary: "bg-amber-500 dark:bg-amber-700",
};

export const rarityBorder: Record<Rarity, string> = {
	common: "border-gray-400 dark:border-gray-600",
	rare: "border-[--system-accent]",
	epic: "border-purple-500 dark:border-purple-700",
	legendary: "border-amber-500 dark:border-amber-700",
};

export const rarityGlowStrong: Record<Rarity, string> = {
	common: "shadow-gray-500/50 dark:shadow-gray-700/50",
	rare: "shadow-[--system-accent]/50",
	epic: "shadow-purple-500/50 dark:shadow-purple-700/50",
	legendary: "shadow-amber-500/70 dark:shadow-amber-700/70",
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
