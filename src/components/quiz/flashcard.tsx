"use client";

import { IconCheck, IconRotate, IconX } from "@tabler/icons-react";
import { motion } from "framer-motion";
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

	if (cards.length === 0) {
		return (
			<Card className="p-8 flex flex-col items-center justify-center gap-4">
				<p className="text-muted-foreground">No flashcards available.</p>
			</Card>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between text-sm text-muted-foreground">
				<span>
					Card {currentIndex + 1} of {cards.length}
				</span>
				<span className="text-xs">
					{cards.length - currentIndex - 1} remaining
				</span>
			</div>

			<div
				className="perspective-1000 cursor-pointer min-h-[300px]"
				onClick={handleFlip}
			>
				<motion.div
					className="relative w-full h-full preserve-3d transition-transform duration-500"
					style={{
						transformStyle: "preserve-3d",
						transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
					}}
				>
					<Card className="absolute inset-0 backface-hidden p-6 flex flex-col items-center justify-center">
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
						style={{ transform: "rotateY(180deg)" }}
					>
						<p className="text-lg font-medium text-center">
							{currentCard.back}
						</p>
					</Card>
				</motion.div>
			</div>

			<div className="flex gap-2">
				<Button variant="outline" className="flex-1" onClick={handleReview}>
					<IconX className="w-4 h-4 mr-2" />
					Review Later
				</Button>
				<Button className="flex-1" onClick={handleKnown}>
					<IconCheck className="w-4 h-4 mr-2" />I Know This
				</Button>
			</div>

			<div className="flex justify-center">
				<Button variant="ghost" size="sm" onClick={handleRestart}>
					<IconRotate className="w-4 h-4 mr-2" />
					Restart
				</Button>
			</div>
		</div>
	);
}
