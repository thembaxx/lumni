import type { DifficultyInput } from "@/lib/shared/difficulty";
import { normalizeDifficulty } from "@/lib/shared/difficulty";

export type { Difficulty, DifficultyInput } from "@/lib/shared/difficulty";

export function getDifficultyColor(difficulty: DifficultyInput): string {
	switch (normalizeDifficulty(difficulty)) {
		case "easy":
			return "bg-success/10 text-success border-success/20";
		case "medium":
			return "bg-warning/10 text-warning border-warning/20";
		case "hard":
			return "bg-destructive/10 text-destructive border-destructive/20";
	}
}

export function getQuizDifficultyColor(difficulty: DifficultyInput): string {
	switch (normalizeDifficulty(difficulty)) {
		case "easy":
			return "bg-success/20 text-success border-success";
		case "medium":
			return "bg-warning/20 text-warning border-warning";
		case "hard":
			return "bg-destructive/20 text-destructive border-destructive";
	}
}
