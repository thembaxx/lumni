"use client";

import { IconCheck, IconX } from "@tabler/icons-react";
import { m } from "framer-motion";
import { Anim } from "@/components/shared/anim";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { iOSEase } from "@/lib/utils/animation";

interface FlashcardItem {
	id: string;
	front: string;
	back: string;
	topic: string;
	difficulty: string;
	hint?: string;
}

interface FlashcardsActiveProps {
	cards: FlashcardItem[];
	currentIndex: number;
	isFlipped: boolean;
	knownCount: number;
	reviewCount: number;
	onFlip: () => void;
	onKnown: () => void;
	onReview: () => void;
	onPrevious: () => void;
	onNext: () => void;
	onQuit: () => void;
}

export function FlashcardsActive({
	cards,
	currentIndex,
	isFlipped,
	knownCount,
	reviewCount,
	onFlip,
	onKnown,
	onReview,
	onPrevious,
	onNext,
	onQuit,
}: FlashcardsActiveProps) {
	const currentCard = cards[currentIndex];
	const totalCards = cards.length;

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				onFlip();
			}
		},
		[onFlip],
	);

	return (
		<div className="min-h-screen bg-background p-4 flex flex-col max-w-md mx-auto">
			<div className="flex items-center justify-between mb-6">
				<Button variant="ghost" size="sm" onClick={onQuit}>
					Quit
				</Button>
				<div className="flex items-center gap-2">
					<Badge variant="outline">
						{currentIndex + 1} / {totalCards}
					</Badge>
					<Badge
						variant="secondary"
						className="text-green-500 dark:text-green-400"
					>
						{knownCount} known
					</Badge>
					<Badge
						variant="secondary"
						className="text-amber-500 dark:text-amber-400"
					>
						{reviewCount} review
					</Badge>
				</div>
			</div>

			<div className="flex-1 flex items-center justify-center">
				<Anim>
					<m.div
						className="perspective-1000 cursor-pointer w-full max-w-md"
						onClick={onFlip}
						onKeyDown={handleKeyDown}
						role="button"
						tabIndex={0}
						aria-label="Flip flashcard"
						initial={{ rotateY: 0 }}
						animate={{ rotateY: isFlipped ? 180 : 0 }}
						transition={{ duration: 0.5, ease: iOSEase }}
					>
						<Card
							className={cn(
								"absolute inset-0 backface-hidden p-6 flex flex-col",
								!isFlipped &&
									"border-[--system-accent]/50 bg-[--system-accent]/5",
							)}
						>
							<div className="flex items-center gap-2 mb-4">
								<Badge variant="outline" className="bg-[--system-accent]/10">
									{currentCard.topic}
								</Badge>
								<Badge variant="outline" className="font-mono text-xs">
									{currentCard.difficulty}
								</Badge>
							</div>
							<div className="flex-1 flex items-center justify-center">
								<p className="text-lg font-medium text-center">
									{currentCard.front}
								</p>
							</div>
							<div className="text-center mt-4">
								<p className="text-xs text-muted-foreground">Tap to flip</p>
							</div>
						</Card>

						<Card
							className="absolute inset-0 backface-hidden p-6 flex flex-col"
							style={{ transform: "rotateY(180deg)" }}
						>
							<div className="flex-1 flex items-center justify-center">
								<p className="text-lg font-medium text-center">
									{currentCard.back}
								</p>
							</div>
							{currentCard.hint && (
								<div className="mt-4 p-3 rounded-lg bg-amber-500/10 dark:bg-amber-700/20">
									<p className="text-xs text-amber-700 dark:text-amber-300">
										Hint: {currentCard.hint}
									</p>
								</div>
							)}
						</Card>
					</m.div>
				</Anim>
			</div>

			{isFlipped && (
				<div className="flex gap-2 mt-4">
					<Button
						variant="outline"
						className="flex-1 border-amber-500/50 text-amber-700 dark:border-amber-700/50 dark:text-amber-300"
						onClick={onReview}
					>
						<IconX className="size-4 mr-2" />
						Review Later
					</Button>
					<Button className="flex-1" onClick={onKnown}>
						<IconCheck className="size-4 mr-2" />I Know This
					</Button>
				</div>
			)}

			<div className="flex justify-between mt-4">
				<Button
					variant="ghost"
					onClick={onPrevious}
					disabled={currentIndex === 0}
				>
					<ChevronLeft className="size-4 mr-2" />
					Previous
				</Button>
				<Button
					variant="ghost"
					onClick={onNext}
					disabled={currentIndex === totalCards - 1}
				>
					Next
					<ChevronRight className="size-4 ml-2" />
				</Button>
			</div>
		</div>
	);
}
