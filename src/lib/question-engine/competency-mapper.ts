import type { BloomLevel, Difficulty } from "./types";

const COMPETENCY_TO_BLOOM: Record<string, BloomLevel[]> = {
  novice: ["remember", "understand"],
  developing: ["understand", "apply"],
  proficient: ["apply", "analyze", "evaluate"],
  mastered: ["evaluate", "create"],
};

const COMPETENCY_TO_DIFFICULTY: Record<string, Difficulty[]> = {
  novice: ["Easy", "Medium"],
  developing: ["Medium"],
  proficient: ["Medium", "Hard"],
  mastered: ["Hard"],
};

export function mapCompetencyToBloom(
  level: "novice" | "developing" | "proficient" | "mastered" | undefined,
  score?: number,
): BloomLevel | undefined {
  if (!level || score === undefined) return undefined;
  const levels = COMPETENCY_TO_BLOOM[level];
  if (!levels) return undefined;
  if (score >= 80 && level === "developing") return "apply";
  if (score >= 90 && level === "proficient") return "evaluate";
  return levels[0];
}

export function mapCompetencyToDifficulty(
  level: "novice" | "developing" | "proficient" | "mastered" | undefined,
): Difficulty | undefined {
  if (!level) return undefined;
  const difficulties = COMPETENCY_TO_DIFFICULTY[level];
  if (!difficulties) return undefined;
  return difficulties[0];
}

export function mapCompetencyToBloomList(
  level: "novice" | "developing" | "proficient" | "mastered" | undefined,
): BloomLevel[] {
  if (!level) return ["remember", "understand", "apply"];
  return COMPETENCY_TO_BLOOM[level] ?? ["remember", "understand"];
}

export function getCompetencyDescription(
  level: "novice" | "developing" | "proficient" | "mastered" | undefined,
): string {
  const descriptions: Record<string, string> = {
    novice: "just starting out — building foundational knowledge",
    developing: "building understanding — working toward proficiency",
    proficient: "showing strong understanding — refining skills",
    mastered: "demonstrating mastery — ready for advanced challenges",
  };
  return level ? (descriptions[level] ?? "") : "";
}
