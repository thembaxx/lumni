import type { Difficulty, Question } from "./types";

export interface CalibrationInput {
  type: string;
  itemCount?: number;
  hasDistractors?: boolean;
  bloomTaxonomy?: string;
}

const BASE_POINTS: Record<string, number> = {
  ordering: 3,
  "fill-in-sequence": 2,
  "match-pairs": 3,
  "diagram-labelling": 3,
  "hot-spot": 1,
  "multiple-choice": 1,
  matching: 3,
  "short-answer": 2,
  calculation: 3,
};

const DIFFICULTY_THRESHOLDS = {
  ordering: { easy: 3, medium: 5, hard: 8 },
  "fill-in-sequence": { easy: 1, medium: 2, hard: 4 },
  "match-pairs": { easy: 2, medium: 4, hard: 6 },
  "diagram-labelling": { easy: 2, medium: 4, hard: 6 },
  "hot-spot": { easy: 2, medium: 4, hard: 6 },
};

const DEFAULT_THRESHOLDS = { easy: 2, medium: 4, hard: 6 };

export function calibrateDifficulty(input: CalibrationInput): {
  difficulty: Difficulty;
  suggestedPoints: number;
} {
  const base = BASE_POINTS[input.type] ?? 2;
  const thresholds =
    DIFFICULTY_THRESHOLDS[input.type as keyof typeof DIFFICULTY_THRESHOLDS] ?? DEFAULT_THRESHOLDS;
  const count = input.itemCount ?? 0;

  let difficulty: Difficulty;
  if (count <= thresholds.easy) {
    difficulty = "Easy";
  } else if (count <= thresholds.medium) {
    difficulty = "Medium";
  } else {
    difficulty = "Hard";
  }

  const multiplier = difficulty === "Easy" ? 1 : difficulty === "Medium" ? 1.5 : 2;
  const suggestedPoints = Math.max(1, Math.round(base * multiplier));

  return { difficulty, suggestedPoints };
}

export function calibrateQuestion(question: Question): Question {
  const body = question.body as Record<string, unknown>;
  let itemCount = 0;

  switch (question.type) {
    case "ordering":
      itemCount = (body.items as { id: string }[] | undefined)?.length ?? 0;
      break;
    case "fill-in-sequence":
      itemCount = (body.blanks as { id: string }[] | undefined)?.length ?? 0;
      break;
    case "match-pairs":
      itemCount = (body.leftItems as { id: string }[] | undefined)?.length ?? 0;
      break;
    case "diagram-labelling":
      itemCount = (body.labels as { id: string }[] | undefined)?.length ?? 0;
      break;
    case "hot-spot":
      itemCount = (body.regions as { id: string }[] | undefined)?.length ?? 0;
      break;
  }

  const { difficulty, suggestedPoints } = calibrateDifficulty({
    type: question.type,
    itemCount,
    bloomTaxonomy: question.bloomTaxonomy,
  });

  return {
    ...question,
    difficulty,
    points: suggestedPoints,
  };
}
