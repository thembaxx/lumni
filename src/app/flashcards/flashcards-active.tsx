"use client";

import { CaretLeft, CaretRight, Check, X } from "@phosphor-icons/react";
import { m } from "framer-motion";
import { useCallback } from "react";
import { Anim } from "@/components/shared/anim";
import { TTSButton } from "@/components/shared/tts-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
		<div className="min-h-[100dvh] bg-background grid grid-cols-12 gap-0">
			<div className="col-span-12 md:col-span-7 col-start-1 flex flex-col">
				<div className="flex items-center justify-between mb-6 p-4">
					<Button variant="ghost" size="sm" onClick={onQuit}>
						Quit
					</Button>
					<div className="flex items-center gap-2">
						<Badge variant="outline">
							{currentIndex + 1} / {totalCards}
						</Badge>
						<Badge
							variant="secondary"
							className="text-success dark:text-success-foreground"
						>
							{knownCount} known
						</Badge>
						<Badge
							variant="secondary"
							className="text-warning dark:text-warning-foreground"
						>
							{reviewCount} review
						</Badge>
					</div>
				</div>

				<div className="flex-1 flex items-center justify-center p-4">
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
							<div
								className={cn(
									"absolute inset-0 backface-hidden p-6 flex flex-col rounded-[2.5rem] border border-border/80 bg-card shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-colors",
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
									<div className="ml-auto">
										<TTSButton text={currentCard.front} />
									</div>
								</div>
								<div className="flex-1 flex items-center justify-center">
									<p className="text-lg font-medium text-center">
										{currentCard.front}
									</p>
								</div>
								<div className="text-center mt-4">
									<p className="text-xs text-muted-foreground">Tap to flip</p>
								</div>
							</div>

							<div
								className="absolute inset-0 backface-hidden p-6 flex flex-col rounded-[2.5rem] border border-border/80 bg-card shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]"
								style={{ transform: "rotateY(180deg)" }}
							>
								<div className="flex items-center justify-end mb-2">
									<TTSButton text={currentCard.back} />
								</div>
								<div className="flex-1 flex items-center justify-center">
									<p className="text-lg font-medium text-center">
										{currentCard.back}
									</p>
								</div>
								{currentCard.hint && (
									<div className="mt-4 p-3 rounded-lg bg-warning/10 dark:bg-warning/20">
										<p className="text-xs text-amber-700 dark:text-amber-300">
											Hint: {currentCard.hint}
										</p>
									</div>
								)}
							</div>
						</m.div>
					</Anim>
				</div>

				{isFlipped && (
					<div className="flex gap-2 mt-4 px-4 pb-4">
						<Button
							variant="outline"
							className="flex-1 border-amber-500/50 text-amber-700 dark:border-amber-700/50 dark:text-amber-300"
							onClick={onReview}
						>
							<X className="size-4 mr-2" />
							Review Later
						</Button>
						<Button className="flex-1" onClick={onKnown}>
							<Check className="size-4 mr-2" />I Know This
						</Button>
					</div>
				)}

				<div className="flex justify-between mt-4 px-4 pb-4">
					<Button
						variant="ghost"
						onClick={onPrevious}
						disabled={currentIndex === 0}
					>
						<CaretLeft className="size-4 mr-2" />
						Previous
					</Button>
					<Button
						variant="ghost"
						onClick={onNext}
						disabled={currentIndex === totalCards - 1}
					>
						Next
						<CaretRight className="size-4 ml-2" />
					</Button>
				</div>
			</div>

			<div className="col-span-12 md:col-span-5 col-start-1 md:col-start-8 relative overflow-hidden bg-system-surface/30">
				<div className="absolute inset-0 bg-gradient-to-br from-[--system-accent]/10 via-transparent to-transparent" />
				<div className="absolute inset-0 flex items-center justify-center p-8">
					<div className="w-full h-full max-w-xs aspect-square rounded-3xl bg-[--system-accent]/10 blur-2xl animate-float-slow" />
				</div>
			</div>
		</div>
	);
}
