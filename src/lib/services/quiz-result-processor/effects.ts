import { logError } from "@/lib/shared/logger";
import type { ExamPartResult, FlashcardEngine, QuizResultDeps } from "./types";

export async function flashcardCreate(
  engine: FlashcardEngine,
  front: string,
  back: string,
  subject: string,
  topic?: string,
): Promise<void> {
  try {
    await engine.create(front, back, subject, topic);
  } catch {
    // Silent — flashcard creation is best-effort
  }
}

export async function flashcardReview(
  engine: FlashcardEngine,
  id: string,
  quality: number,
): Promise<void> {
  try {
    await engine.review(id, quality);
  } catch {
    // Silent — flashcard review is best-effort
  }
}

export function getCorrectAnswerText(part: ExamPartResult["part"]): string {
  if (part.options) {
    const correct = part.options.find((o) => o.isCorrect);
    return correct ? `${correct.id}. ${correct.text}` : "";
  }
  return "";
}
