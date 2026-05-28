"use client";

import { BrainIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useRef, useState } from "react";
import { SwipeableCardDeck } from "@/components/flashcard/swipeable-card-deck";
import type { FlashcardCardData } from "@/components/flashcard/types";
import { Badge } from "@/components/ui/badge";
import { useSpacedRepetition } from "@/hooks/use-spaced-repetition";

export function SM2StudySession({ subject: _subject }: { subject?: string }) {
	const { dueCards, newCards, review, stats } = useSpacedRepetition();
	const [sessionComplete, setSessionComplete] = useState(false);
	const [reviewed, setReviewed] = useState(0);
	const reviewedRef = useRef(0);

	const allCards: FlashcardCardData[] = [
		...dueCards.map((c) => ({
			id: c.id,
			front: c.front,
			back: c.back,
			topic: c.topic,
			difficulty: String(c.difficulty),
			hint: undefined,
		})),
		...newCards.slice(0, 10).map((c) => ({
			id: c.id,
			front: c.front,
			back: c.back,
			topic: c.topic,
			difficulty: String(c.difficulty),
			hint: undefined,
		})),
	];

	const handleReview = useCallback(
		(cardId: string, quality: number) => {
			review(cardId, quality);
			reviewedRef.current += 1;
			setReviewed(reviewedRef.current);
		},
		[review],
	);

	const handleComplete = useCallback(() => {
		setSessionComplete(true);
	}, []);

	if (allCards.length === 0) {
		return (
			<div className="py-12 text-center">
				<HugeiconsIcon
					icon={BrainIcon}
					className="mx-auto mb-4 size-12 text-muted-foreground"
				/>
				<h3 className="mb-2 font-semibold text-xl">All Caught Up!</h3>
				<p className="text-muted-foreground">
					No cards due for review. Add more flashcards or come back later.
				</p>
			</div>
		);
	}

	if (sessionComplete) {
		return (
			<div className="py-12 text-center">
				<div className="mb-4 text-6xl">🎉</div>
				<h3 className="mb-2 font-semibold text-xl">Session Complete!</h3>
				<p className="mb-4 text-muted-foreground">
					You reviewed {reviewed} card{reviewed !== 1 ? "s" : ""}.
				</p>
				<p className="text-muted-foreground text-sm">
					{stats.due} more cards due later
				</p>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-xl">
			<div className="mb-4 flex items-center justify-between">
				<span className="text-muted-foreground text-sm">
					SM-2 Study Session
				</span>
				<div className="flex gap-2">
					<Badge className="bg-muted text-foreground">
						{dueCards.length} due
					</Badge>
					<Badge className="bg-success/10 text-success-foreground">
						{newCards.length} new
					</Badge>
				</div>
			</div>

			<SwipeableCardDeck
				cards={allCards}
				mode="sm2"
				onReview={handleReview}
				onComplete={handleComplete}
			/>
		</div>
	);
}

export function FlashcardStats() {
	const { stats } = useSpacedRepetition();

	return (
		<div className="grid grid-cols-5 gap-2">
			<div className="rounded bg-muted p-2 text-center">
				<div className="font-extrabold text-lg">{stats.total}</div>
				<div className="text-muted-foreground text-xs">Total</div>
			</div>
			<div className="rounded bg-destructive/10 p-2 text-center">
				<div className="font-extrabold text-destructive text-lg">
					{stats.due}
				</div>
				<div className="text-destructive text-xs">Due</div>
			</div>
			<div className="rounded bg-warning/10 p-2 text-center">
				<div className="font-extrabold text-lg text-warning">
					{stats.learning}
				</div>
				<div className="text-warning text-xs">Learning</div>
			</div>
			<div className="rounded bg-success/10 p-2 text-center">
				<div className="font-extrabold text-lg text-success">
					{stats.mature}
				</div>
				<div className="text-success text-xs">Mastered</div>
			</div>
			<div className="rounded bg-muted p-2 text-center">
				<div className="font-extrabold text-foreground text-lg">
					{stats.new}
				</div>
				<div className="text-muted-foreground text-xs">New</div>
			</div>
		</div>
	);
}
