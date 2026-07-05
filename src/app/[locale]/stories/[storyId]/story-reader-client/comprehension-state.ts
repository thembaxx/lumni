import { trackComprehensionResult } from "@/lib/competency-engine";
import { logError } from "@/lib/shared/logger";

export function computeOverallScore(scores: Map<string, number>): number {
  if (scores.size === 0) return 0;
  return Math.round([...scores.values()].reduce((a, b) => a + b, 0) / scores.size);
}

export function addQuestionScore(
  prevScores: Map<string, number>,
  questionId: string,
  score: number,
): Map<string, number> {
  const next = new Map(prevScores);
  next.set(questionId, score);
  return next;
}

export async function trackComprehensionIfComplete(
  questions: { id: string }[] | null,
  scores: Map<string, number>,
  allGraded: boolean,
  userId: string,
  storyId: string,
  language: string,
): Promise<boolean> {
  if (!questions || questions.length === 0 || allGraded) return false;
  const allDone = questions.every((q) => scores.has(q.id));
  if (!allDone) return false;
  const allScores = questions.map((q) => scores.get(q.id) ?? 0);
  await trackComprehensionResult(userId, storyId, language, allScores).catch((err: unknown) =>
    logError("trackComprehensionResult", err),
  );
  return true;
}
