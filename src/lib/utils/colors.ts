import { normalizeDifficulty } from "@/lib/shared/difficulty";

export type { Difficulty, DifficultyInput } from "@/lib/shared/difficulty";

export function getDifficultyColor(difficulty: string): string {
  switch (normalizeDifficulty(difficulty)) {
    case "Easy":
      return "bg-success/10 text-success border-success/20";
    case "Medium":
      return "bg-warning/10 text-warning border-warning/20";
    case "Hard":
      return "bg-destructive/10 text-destructive border-destructive/20";
  }
}

export function getQuizDifficultyColor(difficulty: string): string {
  switch (normalizeDifficulty(difficulty)) {
    case "Easy":
      return "bg-success/20 text-success border-success";
    case "Medium":
      return "bg-warning/20 text-warning border-warning";
    case "Hard":
      return "bg-destructive/20 text-destructive border-destructive";
  }
}
