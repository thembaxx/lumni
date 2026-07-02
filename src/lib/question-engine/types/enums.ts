export type QuestionType =
  | "multiple-choice"
  | "matching"
  | "short-answer"
  | "long-answer"
  | "essay"
  | "calculation"
  | "diagram"
  | "source-based"
  | "programming"
  | "data-response"
  | "mixed"
  | "ordering"
  | "fill-in-sequence"
  | "match-pairs"
  | "diagram-labelling"
  | "hot-spot";

export type Difficulty = "Easy" | "Medium" | "Hard";

export type BloomLevel = "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create";
