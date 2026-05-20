export type Difficulty = "easy" | "medium" | "hard";
export type DifficultyInput = Difficulty | "Easy" | "Medium" | "Hard";

export function normalizeDifficulty(d: DifficultyInput): Difficulty {
	return d.toLowerCase() as Difficulty;
}

export const DIFFICULTY_VALUES: Difficulty[] = ["easy", "medium", "hard"];
export const DIFFICULTY_INPUT_VALUES: DifficultyInput[] = [
	"easy",
	"medium",
	"hard",
	"Easy",
	"Medium",
	"Hard",
];

export function isValidDifficulty(d: string): d is DifficultyInput {
	return DIFFICULTY_INPUT_VALUES.includes(d as DifficultyInput);
}
