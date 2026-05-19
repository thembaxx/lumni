"use client";

import { BrainIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useSpacedRepetition } from "@/hooks/use-spaced-repetition";
import { SM2_QUALITIES } from "@/lib/utils/spaced-repetition";

export function SM2StudySession({ subject }: { subject?: string }) {
	const { dueCards, newCards, review, stats } = useSpacedRepetition();
	const [currentIndex, setCurrentIndex] = useState(0);
	const [showAnswer, setShowAnswer] = useState(false);
	const [sessionComplete, setSessionComplete] = useState(false);
	const [reviewed, setReviewed] = useState(0);

	const allCards = [...dueCards, ...newCards.slice(0, 10)];
	const currentCard = allCards[currentIndex];

	if (allCards.length === 0) {
		return (
			<div className="py-12 text-center">
				<HugeiconsIcon
					icon={BrainIcon}
					className="mx-auto mb-4 size-12 text-muted-foreground"
				/>
				<h3 className="mb-2 font-semibold text-xl">All Caught Up! 🎉</h3>
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

	const handleReview = (quality: number) => {
		review(currentCard.id, quality);
		setReviewed((r) => r + 1);
		setShowAnswer(false);

		if (currentIndex >= allCards.length - 1) {
			setSessionComplete(true);
		} else {
			setCurrentIndex((i) => i + 1);
		}
	};

	return (
		<div className="mx-auto max-w-xl">
			<div className="mb-4 flex items-center justify-between">
				<span className="text-muted-foreground text-sm">
					Card {currentIndex + 1} of {allCards.length}
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

			<Card className="min-h-[300px] p-0">
				<CardContent className="flex min-h-[300px] flex-col items-center justify-center p-6">
					<p className="mb-8 text-center font-medium text-lg">
						{currentCard?.front}
					</p>

					{showAnswer ? (
						<div className="w-full">
							<div className="mb-6 rounded-lg bg-muted p-4 text-center">
								<p className="text-lg">{currentCard?.back}</p>
							</div>

							<p className="mb-4 text-center text-muted-foreground text-sm">
								How well did you know this?
							</p>

							<div className="grid grid-cols-3 gap-2">
								{SM2_QUALITIES.slice(0, 3).map((q) => (
									<Button
										key={q.quality}
										variant="outline"
										onClick={() => handleReview(q.quality)}
										className="text-xs"
									>
										{q.label}
									</Button>
								))}
							</div>
							<div className="mt-2 grid grid-cols-3 gap-2">
								{SM2_QUALITIES.slice(3).map((q) => (
									<Button
										key={q.quality}
										onClick={() => handleReview(q.quality)}
										className="text-xs"
									>
										{q.label}
									</Button>
								))}
							</div>
						</div>
					) : (
						<Button onClick={() => setShowAnswer(true)} size="lg">
							Show Answer
						</Button>
					)}
				</CardContent>
			</Card>

			<div className="mt-4 flex justify-center gap-2">
				<Button
					variant="ghost"
					size="sm"
					onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
					disabled={currentIndex === 0}
				>
					Previous
				</Button>
				<Button
					variant="ghost"
					size="sm"
					onClick={() => {
						setShowAnswer(false);
						if (currentIndex >= allCards.length - 1) {
							setSessionComplete(true);
						} else {
							setCurrentIndex((i) => i + 1);
						}
					}}
				>
					Skip
				</Button>
			</div>
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
