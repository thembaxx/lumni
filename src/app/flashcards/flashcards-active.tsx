"use client";

import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { m } from "framer-motion";
import { useCallback } from "react";
import { Anim } from "@/components/shared/anim";
import { TTSButton } from "@/components/shared/tts-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/shared";
import { iOSEase } from "@/lib/utils/animation";
import { SM2_QUALITIES } from "@/lib/utils/spaced-repetition";

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
	onReview: (quality: number) => void;
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
		<div className="grid min-h-[100dvh] grid-cols-12 gap-0 bg-background">
			<div className="col-span-12 col-start-1 flex flex-col md:col-span-7">
				<div className="mb-6 flex items-center justify-between p-4">
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

				<div className="flex flex-1 items-center justify-center p-4">
					<Anim>
						<m.div
							className="perspective-1000 w-full max-w-md cursor-pointer"
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
									"backface-hidden absolute inset-0 flex flex-col rounded-card-lg border border-border/80 bg-card p-6 shadow-level-2 transition-colors",
									!isFlipped &&
										"border-[--system-accent]/50 bg-[--system-accent]/5",
								)}
							>
								<div className="mb-4 flex items-center gap-2">
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
								<div className="flex flex-1 items-center justify-center">
									<p className="text-center font-medium text-lg">
										{currentCard.front}
									</p>
								</div>
								<div className="mt-4 text-center">
									<p className="text-muted-foreground text-xs">Tap to flip</p>
								</div>
							</div>

							<div
								className="backface-hidden absolute inset-0 flex flex-col rounded-card-lg border border-border/80 bg-card p-6 shadow-level-2"
								style={{ transform: "rotateY(180deg)" }}
							>
								<div className="mb-2 flex items-center justify-end">
									<TTSButton text={currentCard.back} />
								</div>
								<div className="flex flex-1 items-center justify-center">
									<p className="text-center font-medium text-lg">
										{currentCard.back}
									</p>
								</div>
								{currentCard.hint && (
									<div className="mt-4 rounded-lg bg-warning/10 p-3 dark:bg-warning/20">
										<p className="text-amber-700 text-xs dark:text-amber-300">
											Hint: {currentCard.hint}
										</p>
									</div>
								)}
							</div>
						</m.div>
					</Anim>
				</div>

				{isFlipped && (
					<div className="mt-4 flex flex-col gap-2 px-4 pb-4">
						<p className="text-center text-muted-foreground text-xs">
							How well did you know this?
						</p>
						<div className="grid grid-cols-3 gap-2">
							{SM2_QUALITIES.slice(0, 3).map((q) => (
								<Button
									key={q.quality}
									variant="outline"
									size="sm"
									onClick={() => onReview(q.quality)}
									className="border-destructive/30 text-destructive text-xs hover:bg-destructive/10"
								>
									{q.label}
								</Button>
							))}
						</div>
						<div className="grid grid-cols-3 gap-2">
							{SM2_QUALITIES.slice(3).map((q) => (
								<Button
									key={q.quality}
									variant="outline"
									size="sm"
									onClick={() => onReview(q.quality)}
									className="border-success/30 text-success text-xs hover:bg-success/10"
								>
									{q.label}
								</Button>
							))}
						</div>
					</div>
				)}

				<div className="mt-4 flex justify-between px-4 pb-4">
					<Button
						variant="ghost"
						onClick={onPrevious}
						disabled={currentIndex === 0}
					>
						<HugeiconsIcon icon={ArrowLeft01Icon} className="mr-2 size-4" />
						Previous
					</Button>
					<Button
						variant="ghost"
						onClick={onNext}
						disabled={currentIndex === totalCards - 1}
					>
						Next
						<HugeiconsIcon icon={ArrowRight01Icon} className="ml-2 size-4" />
					</Button>
				</div>
			</div>

			<div className="relative col-span-12 col-start-1 overflow-hidden bg-system-surface/30 md:col-span-5 md:col-start-8">
				<div className="absolute inset-0 bg-gradient-to-br from-[--system-accent]/10 via-transparent to-transparent" />
				<div className="absolute inset-0 flex items-center justify-center p-8">
					<div className="aspect-square h-full w-full max-w-xs animate-float-slow rounded-3xl bg-[--system-accent]/10 blur-2xl" />
				</div>
			</div>
		</div>
	);
}
