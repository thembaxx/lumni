export type Difficulty = "Easy" | "Medium" | "Hard";
export type DifficultyInput = Difficulty;

export function normalizeDifficulty(d: string): Difficulty {
	const lower = d.toLowerCase();
	if (lower === "easy") return "Easy";
	if (lower === "medium") return "Medium";
	if (lower === "hard") return "Hard";
	return "Medium";
}

export const DIFFICULTY_VALUES: Difficulty[] = ["Easy", "Medium", "Hard"];
export const DIFFICULTY_INPUT_VALUES: Difficulty[] = DIFFICULTY_VALUES;

export function isValidDifficulty(d: string): d is DifficultyInput {
	return DIFFICULTY_INPUT_VALUES.includes(d as DifficultyInput);
}
