"use client";

import { AnimatePresence, domAnimation, LazyMotion, m } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface FlashcardData {
	id: string;
	front: string;
	back: string;
	hint?: string;
}

interface FlashcardProps {
	cards: FlashcardData[];
	onKnown?: (cardId: string) => void;
	onReview?: (cardId: string) => void;
}

export function Flashcard({ cards, onKnown, onReview }: FlashcardProps) {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [isFlipped, setIsFlipped] = useState(false);

	const currentCard = cards[currentIndex];

	function handleFlip() {
		setIsFlipped(!isFlipped);
	}

	function handleKnown() {
		onKnown?.(currentCard.id);
		nextCard();
	}

	function handleReview() {
		onReview?.(currentCard.id);
		nextCard();
	}

	function nextCard() {
		if (currentIndex < cards.length - 1) {
			setCurrentIndex((prev) => prev + 1);
		} else {
			setCurrentIndex(0);
		}
		setIsFlipped(false);
	}

	function handleRestart() {
		setCurrentIndex(0);
		setIsFlipped(false);
	}

	function handleKeyDown(e: React.KeyboardEvent) {
		if (e.key === " " || e.key === "Enter") {
			handleFlip();
		} else if (e.key === "ArrowRight" && isFlipped) {
			handleKnown();
		} else if (e.key === "ArrowLeft" && isFlipped) {
			handleReview();
		}
	}

	if (cards.length === 0) {
		return (
			<Card className="p-8 flex flex-col items-center justify-center gap-4">
				<p className="text-muted-foreground">No flashcards available.</p>
			</Card>
		);
	}

	return (
		<LazyMotion features={domAnimation}>
			<div
				className="space-y-4"
				onKeyDown={handleKeyDown}
				tabIndex={0}
				role="region"
				aria-label="Flashcard quiz"
			>
				<div className="flex items-center justify-between text-sm text-muted-foreground">
					<span>
						Card {currentIndex + 1} of {cards.length}
					</span>
					<span className="text-xs">
						{cards.length - currentIndex - 1} remaining
					</span>
				</div>

				<div
					className="perspective-1000 cursor-pointer min-h-75"
					onClick={handleFlip}
					onKeyDown={(e) => {
						if (e.key === " " || e.key === "Enter") {
							e.preventDefault();
							handleFlip();
						}
					}}
					role="button"
					tabIndex={0}
					aria-label={isFlipped ? "Flip card to front" : "Flip card to back"}
				>
					<m.div
						className="relative w-full h-full preserve-3d transition-transform duration-500"
						style={{
							transformStyle: "preserve-3d",
							transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
						}}
					>
						<Card
							className="absolute inset-0 backface-hidden p-6 flex flex-col items-center justify-center"
							style={{ backfaceVisibility: "hidden" }}
						>
							<p className="text-lg font-medium text-center">
								{currentCard.front}
							</p>
							{currentCard.hint && (
								<p className="text-xs text-muted-foreground mt-4">
									Hint: {currentCard.hint}
								</p>
							)}
							<p className="text-xs text-muted-foreground mt-8">Tap to flip</p>
						</Card>

						<Card
							className="absolute inset-0 backface-hidden p-6 flex flex-col items-center justify-center"
							style={{
								transform: "rotateY(180deg)",
								backfaceVisibility: "hidden",
							}}
						>
							<p className="text-lg font-medium text-center">
								{currentCard.back}
							</p>
						</Card>
					</m.div>
				</div>

				<div className="flex gap-2">
					<Button variant="outline" className="flex-1" onClick={handleReview}>
						Review Later
					</Button>
					<Button className="flex-1" onClick={handleKnown}>
						I Know This
					</Button>
				</div>

				<div className="flex justify-center">
					<Button variant="ghost" size="sm" onClick={handleRestart}>
						Restart
					</Button>
				</div>
			</div>
		</LazyMotion>
	);
}
