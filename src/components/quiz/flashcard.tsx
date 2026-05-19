"use client";

import { m } from "framer-motion";
import { useState } from "react";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Anim } from "@/components/shared/anim";
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
	subject?: string;
	onKnown?: (cardId: string) => void;
	onReview?: (cardId: string) => void;
}

export function Flashcard({
	cards,
	subject,
	onKnown,
	onReview,
}: FlashcardProps) {
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
			<Card className="mx-auto flex w-full max-w-md flex-col items-center justify-center gap-4 p-8">
				<p className="text-muted-foreground">No flashcards available.</p>
			</Card>
		);
	}

	return (
		<Anim>
			<div
				className="flex flex-col gap-4"
				onKeyDown={handleKeyDown}
				role="region"
				aria-label="Flashcard quiz"
			>
				<div className="flex items-center justify-between text-muted-foreground text-sm">
					<span>
						Card {currentIndex + 1} of {cards.length}
					</span>
					<span className="text-xs">
						{cards.length - currentIndex - 1} remaining
					</span>
				</div>

				<div
					className="perspective-1000 min-h-75 cursor-pointer"
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
						className="preserve-3d relative h-full w-full transition-transform duration-500"
						style={{
							transformStyle: "preserve-3d",
							transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
						}}
					>
						<div
							className="backface-hidden absolute inset-0 flex flex-col items-center justify-center rounded-[2.5rem] border border-border/80 bg-card p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]"
							style={{ backfaceVisibility: "hidden" }}
						>
							<div className="text-center font-medium text-lg">
								<MarkdownRenderer
									content={currentCard.front}
									subject={subject}
								/>
							</div>
							{currentCard.hint && (
								<div className="mt-4 text-muted-foreground text-xs">
									<MarkdownRenderer
										content={`Hint: ${currentCard.hint}`}
										subject={subject}
									/>
								</div>
							)}
							<p className="mt-8 text-muted-foreground text-xs">Tap to flip</p>
						</div>

						<div
							className="backface-hidden absolute inset-0 flex flex-col items-center justify-center rounded-[2.5rem] border border-border/80 bg-card p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]"
							style={{
								transform: "rotateY(180deg)",
								backfaceVisibility: "hidden",
							}}
						>
							<div className="text-center font-medium text-lg">
								<MarkdownRenderer
									content={currentCard.back}
									subject={subject}
								/>
							</div>
						</div>
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
		</Anim>
	);
}
