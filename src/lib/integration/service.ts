import { dexieDataAccess } from "@/lib/db";
import type { DataAccess } from "@/lib/db/data-access";
import { logError } from "@/lib/shared/logger";

let _deps: { db: DataAccess } = { db: dexieDataAccess };
export function __setDepsForTesting(deps: { db: DataAccess }) {
  _deps = deps;
}

// ── Integration 1: Lesson→Past Questions loop ──
// When a lesson is completed, suggest 3 related past questions.

export async function suggestQuestionsForLesson(
  subject: string,
  subtopicId: string,
): Promise<{ id: string; questionText: string; year: number; marks: number }[]> {
  try {
    const all = await _deps.db.pastPaperQuestions.where("subject").equals(subject).toArray();
    const matched = all.filter((q) => q.subtopicId === subtopicId);
    return matched.slice(0, 3).map((q) => ({
      id: q.id,
      questionText: q.questionText,
      year: q.year,
      marks: q.marks ?? 0,
    }));
  } catch (err) {
    logError("Integration.suggestQuestions", err);
    return [];
  }
}

// ── Integration 4: Dictionary→Flashcard loop ──
// Saved vocabulary words auto-create SM-2 flashcards.

export async function createFlashcardFromVocabulary(
  userId: string,
  word: string,
  definition: string,
  subject: string,
): Promise<void> {
  try {
    const cardId = `vocab-${userId}-${word.toLowerCase()}`;
    const existing = await _deps.db.flashcards.get(cardId);
    if (existing) return;
    const now = Date.now();
    await _deps.db.flashcards.put({
      id: cardId,
      subject,
      topic: "vocabulary",
      front: word,
      back: definition,
      nextReview: now,
      lastReview: null,
      createdAt: now,
      updatedAt: now,
      algorithm: "sm2",
      easeFactor: 2.5,
      interval: 0,
      repetitions: 0,
      stability: 0,
      difficulty: 0,
      lapses: 0,
      status: "active",
      learningStep: 0,
      leeched: false,
    });
  } catch (err) {
    logError("Integration.vocabFlashcard", err);
  }
}
