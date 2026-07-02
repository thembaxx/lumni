import type { DataAccess } from "@/lib/db/data-access";
import type { FlashcardSM2 } from "./types";

export function generateId(): string {
  return `fc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function subjectFilter(card: FlashcardSM2, subject?: string): boolean {
  return !subject || card.subject === subject;
}

export function pickAlgorithm(): "sm2" | "fsrs" {
  return "fsrs";
}

export function syncCardPayload(card: FlashcardSM2): Record<string, unknown> {
  return {
    id: card.id,
    front: card.front,
    back: card.back,
    subject: card.subject,
    topic: card.topic,
    easeFactor: card.easeFactor,
    interval: card.interval,
    repetitions: card.repetitions,
    nextReview: card.nextReview,
    lastReview: card.lastReview,
    createdAt: card.createdAt,
    updatedAt: card.updatedAt,
  };
}

export async function countConsecutivePasses(
  db: DataAccess,
  cardId: string,
): Promise<number> {
  const history = await db.reviewHistory
    .where("cardId")
    .equals(cardId)
    .toReversed()
    .sortBy("reviewedAt");
  const recent = history.toReversed().slice(-10);
  let count = 0;
  for (let i = recent.length - 1; i >= 0; i--) {
    if (recent[i].quality >= 3) {
      count++;
    } else {
      break;
    }
  }
  return count;
}
