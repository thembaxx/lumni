import type { FlashcardDataAccess } from "@/lib/db/data-access";
import { logError } from "@/lib/shared/logger";
import { enqueueOutbox } from "@/lib/sync/outbox";
import { generateId, pickAlgorithm, syncCardPayload } from "./engine-helpers";
import type { FlashcardSM2 } from "./types";

type EnqueueFn = (type: string, payload: Record<string, unknown>) => Promise<unknown>;

export async function createCard(
  db: FlashcardDataAccess,
  enqueueFn: EnqueueFn,
  front: string,
  back: string,
  subject: string,
  topic?: string,
): Promise<FlashcardSM2> {
  const algorithm = pickAlgorithm();
  const card: FlashcardSM2 = {
    id: generateId(),
    front,
    back,
    subject,
    topic,
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReview: Date.now(),
    lastReview: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    algorithm,
    stability: 0,
    difficulty: 5,
    status: "active",
    lapses: 0,
    learningStep: 0,
    leeched: false,
  };
  await db.flashcards.add(card);

  enqueueFn("appwrite-flashcard-sync", syncCardPayload(card)).catch((e: unknown) =>
    logError("FlashcardEngine.CreateSync", e),
  );
  enqueueOutbox("flashcards", card.id, "create", card).catch((e: unknown) =>
    logError("FlashcardEngine.CreateOutbox", e),
  );

  return card;
}

export async function updateCard(
  db: FlashcardDataAccess,
  enqueueFn: EnqueueFn,
  id: string,
  updates: Partial<FlashcardSM2>,
): Promise<void> {
  const merged = { ...updates, updatedAt: Date.now() };
  await db.flashcards.update(id, merged);
  enqueueFn("appwrite-flashcard-sync", {
    id,
    front: updates.front ?? "",
    back: updates.back ?? "",
    subject: updates.subject ?? "",
    topic: updates.topic,
    easeFactor: updates.easeFactor ?? 0,
    interval: updates.interval ?? 0,
    repetitions: updates.repetitions ?? 0,
    nextReview: updates.nextReview ?? 0,
    lastReview: updates.lastReview ?? null,
    createdAt: updates.createdAt ?? 0,
    updatedAt: Date.now(),
  }).catch((e: unknown) => logError("FlashcardEngine.UpdateSync", e));

  const card = await db.flashcards.get(id);
  if (card) {
    enqueueOutbox("flashcards", id, "update", card).catch((e: unknown) =>
      logError("FlashcardEngine.UpdateOutbox", e),
    );
  }
}

export async function deleteCard(
  db: FlashcardDataAccess,
  enqueueFn: EnqueueFn,
  id: string,
): Promise<void> {
  await db.flashcards.delete(id);
  enqueueFn("appwrite-flashcard-delete", { id }).catch((e: unknown) =>
    logError("FlashcardEngine.DeleteSync", e),
  );
  enqueueOutbox("flashcards", id, "delete", { id }).catch((e: unknown) =>
    logError("FlashcardEngine.DeleteOutbox", e),
  );
}

export async function convertQuizToFlashcards(
  db: FlashcardDataAccess,
  enqueueFn: EnqueueFn,
  questions: Array<{
    id: string;
    questionText: string;
    options: Array<{ text: string; isCorrect: boolean }>;
    explanation: string;
  }>,
  subject: string,
): Promise<FlashcardSM2[]> {
  const newCards = await Promise.all(
    questions.flatMap((q) => {
      const correctOption = q.options.find((o) => o.isCorrect);
      if (!correctOption) return [];
      return [createCard(db, enqueueFn, q.questionText, correctOption.text, subject, q.id)];
    }),
  );
  return newCards;
}
