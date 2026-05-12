"use client";

import { Brain, Check, RotateCcw, X } from "lucide-react";
import { useCallback, useState } from "react";
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
			<div className="text-center py-12">
				<Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
				<h3 className="text-xl font-semibold mb-2">All Caught Up! 🎉</h3>
				<p className="text-muted-foreground">
					No cards due for review. Add more flashcards or come back later.
				</p>
			</div>
		);
	}

	if (sessionComplete) {
		return (
			<div className="text-center py-12">
				<div className="text-6xl mb-4">🎉</div>
				<h3 className="text-xl font-semibold mb-2">Session Complete!</h3>
				<p className="text-muted-foreground mb-4">
					You reviewed {reviewed} card{reviewed !== 1 ? "s" : ""}.
				</p>
				<p className="text-sm text-muted-foreground">
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
		<div className="max-w-xl mx-auto">
			<div className="mb-4 flex items-center justify-between">
				<span className="text-sm text-muted-foreground">
					Card {currentIndex + 1} of {allCards.length}
				</span>
				<div className="flex gap-2">
					<span className="text-xs px-2 py-1 bg-muted text-foreground rounded">
						{dueCards.length} due
					</span>
					<span className="text-xs px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200 rounded">
						{newCards.length} new
					</span>
				</div>
			</div>

			<Card className="min-h-[300px]">
				<CardContent className="p-6 flex flex-col items-center justify-center min-h-[300px]">
					<p className="text-lg text-center mb-8 font-medium">
						{currentCard?.front}
					</p>

					{showAnswer ? (
						<div className="w-full">
							<div className="p-4 bg-muted rounded-lg mb-6 text-center">
								<p className="text-lg">{currentCard?.back}</p>
							</div>

							<p className="text-sm text-muted-foreground text-center mb-4">
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
							<div className="grid grid-cols-3 gap-2 mt-2">
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
			<div className="text-center p-2 bg-muted rounded">
				<div className="text-lg font-bold">{stats.total}</div>
				<div className="text-xs text-muted-foreground">Total</div>
			</div>
			<div className="text-center p-2 bg-red-100 dark:bg-red-900/40 rounded">
				<div className="text-lg font-bold text-red-700">{stats.due}</div>
				<div className="text-xs text-red-600">Due</div>
			</div>
			<div className="text-center p-2 bg-yellow-100 dark:bg-yellow-900/40 rounded">
				<div className="text-lg font-bold text-yellow-700">
					{stats.learning}
				</div>
				<div className="text-xs text-yellow-600">Learning</div>
			</div>
			<div className="text-center p-2 bg-green-100 dark:bg-green-900/40 rounded">
				<div className="text-lg font-bold text-green-700">{stats.mature}</div>
				<div className="text-xs text-green-600">Mastered</div>
			</div>
			<div className="text-center p-2 bg-muted rounded">
				<div className="text-lg font-bold text-foreground">{stats.new}</div>
				<div className="text-xs text-muted-foreground">New</div>
			</div>
		</div>
	);
}
