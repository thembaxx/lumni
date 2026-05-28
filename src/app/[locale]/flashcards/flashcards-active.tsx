"use client";

import { SwipeableCardDeck } from "@/components/flashcard/swipeable-card-deck";
import type { FlashcardCardData } from "@/components/flashcard/types";

interface FlashcardsActiveProps {
	cards: FlashcardCardData[];
	knownCount: number;
	reviewCount: number;
	onReview: (cardId: string, quality: number) => void;
	onComplete: () => void;
	onQuit: () => void;
}

export function FlashcardsActive({
	cards,
	knownCount,
	reviewCount,
	onReview,
	onComplete,
	onQuit: _onQuit,
}: FlashcardsActiveProps) {
	return (
		<SwipeableCardDeck
			cards={cards}
			mode="sm2"
			onReview={onReview}
			onComplete={onComplete}
			knownCount={knownCount}
			reviewCount={reviewCount}
		/>
	);
}
