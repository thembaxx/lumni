export type Difficulty = "easy" | "medium" | "hard";

export function getDifficultyColor(difficulty: Difficulty): string {
	switch (difficulty) {
		case "easy":
			return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
		case "medium":
			return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
		case "hard":
			return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
	}
}

export function getQuizDifficultyColor(difficulty: Difficulty): string {
	switch (difficulty) {
		case "easy":
			return "bg-success/20 text-success border-success";
		case "medium":
			return "bg-warning/20 text-warning border-warning";
		case "hard":
			return "bg-destructive/20 text-destructive border-destructive";
	}
}
