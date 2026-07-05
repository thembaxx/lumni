import type { FlashcardDeckCard } from "@/lib/flashcard-engine/deck-types";
import { shareFlashcardDeck } from "@/lib/share/share-service";
import type { FlashcardItem } from "./types";

export async function shareFlashcardSession(
  cards: FlashcardItem[],
  subject: string,
  userId: string,
): Promise<string> {
  const shareCards: FlashcardDeckCard[] = cards.map((c) => ({
    front: c.front,
    back: c.back,
  }));
  const shareId = await shareFlashcardDeck(
    {
      title: `${subject} Flashcard Session`,
      subject,
      cards: shareCards,
      cardCount: shareCards.length,
      createdBy: userId,
    },
    userId,
  );
  return `${window.location.origin}/shared/deck/${shareId}`;
}
