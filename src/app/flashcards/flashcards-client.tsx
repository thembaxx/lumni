"use client";

import { IconCheck, IconX } from "@tabler/icons-react";
import { domAnimation, LazyMotion, m } from "framer-motion";
import {
	ChevronLeft,
	ChevronRight,
	Home,
	Lightbulb,
	RotateCcw,
	Target,
} from "lucide-react";
import { useCallback, useState } from "react";
import { SubjectsDrawer } from "@/components/dashboard/drawers/subjects-drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { useSubjectQuestions } from "@/lib/hooks/use-subject-questions";
import type { QAQuestion } from "@/lib/types/questions";
import { cn } from "@/lib/utils";

interface FlashcardItem {
	id: string;
	front: string;
	back: string;
	topic: string;
	difficulty: string;
	hint?: string;
	easeFactor: number;
	interval: number;
	nextReview: number;
}

interface FlashcardsClientProps {}

export function FlashcardsClient({}: FlashcardsClientProps) {
	const [selectedSubject, setSelectedSubject] = useState<string>("");
	const [isActive, setIsActive] = useState(false);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [isFlipped, setIsFlipped] = useState(false);
	const [knownCards, setKnownCards] = useState<Set<string>>(new Set());
	const [reviewCards, setReviewCards] = useState<Set<string>>(new Set());
	const [sessionComplete, setSessionComplete] = useState(false);

	const subjectToFetch = selectedSubject.toLowerCase();
	const { data: questions, isLoading } = useSubjectQuestions(
		subjectToFetch,
		20,
		{
			enabled: isActive && !!selectedSubject,
		},
	);

	const cards: FlashcardItem[] =
		isLoading === false && questions?.length
			? questions.map((q) => ({
					id: q.id,
					front: q.questionText,
					back: q.explanation,
					topic: q.topic,
					difficulty: q.difficulty,
					hint: q.hint,
					easeFactor: 2.5,
					interval: 1,
					nextReview: Date.now(),
				}))
			: [];

	const currentCard = cards[currentIndex];
	const totalCards = cards.length;

	const startSession = useCallback((subject: string) => {
		setSelectedSubject(subject);
		setIsActive(true);
		setCurrentIndex(0);
		setIsFlipped(false);
		setKnownCards(new Set());
		setReviewCards(new Set());
		setSessionComplete(false);
	}, []);

	const stopSession = useCallback(() => {
		setIsActive(false);
		setSelectedSubject("");
	}, []);

	const handleFlip = useCallback(() => {
		setIsFlipped((prev) => !prev);
	}, []);

	const nextCard = useCallback(() => {
		if (currentIndex < cards.length - 1) {
			setCurrentIndex((prev) => prev + 1);
		} else {
			setSessionComplete(true);
		}
		setIsFlipped(false);
	}, [currentIndex, cards.length]);

	const handleKnown = useCallback(() => {
		if (!currentCard) return;
		setKnownCards((prev) => new Set(prev).add(currentCard.id));
		nextCard();
	}, [currentCard, nextCard]);

	const handleReview = useCallback(() => {
		if (!currentCard) return;
		setReviewCards((prev) => new Set(prev).add(currentCard.id));
		nextCard();
	}, [currentCard, nextCard]);

	const previousCard = useCallback(() => {
		if (currentIndex > 0) {
			setCurrentIndex((prev) => prev - 1);
			setIsFlipped(false);
		}
	}, [currentIndex]);

	const handleRestart = useCallback(() => {
		setCurrentIndex(0);
		setIsFlipped(false);
		setKnownCards(new Set());
		setReviewCards(new Set());
		setSessionComplete(false);
	}, []);

	if (!isActive) {
		return (
			<div className="min-h-screen bg-background p-4 flex items-center justify-center">
				<Card className="max-w-md w-full">
					<CardHeader className="text-center">
						<CardTitle className="text-2xl">Flashcards</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<Empty>
							<EmptyHeader>
								<EmptyMedia variant="icon">
									<Lightbulb className="size-8" />
								</EmptyMedia>
								<EmptyTitle>Start Learning</EmptyTitle>
								<EmptyDescription>
									Select a subject to study with flashcards
								</EmptyDescription>
							</EmptyHeader>
							<EmptyContent>
								<SubjectsDrawer onSelect={startSession}>
									<Button>Choose Subject</Button>
								</SubjectsDrawer>
							</EmptyContent>
						</Empty>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="min-h-screen bg-background p-4 flex items-center justify-center">
				<Card className="max-w-md w-full">
					<CardContent className="p-8 text-center">
						<p className="text-muted-foreground">Loading flashcards...</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (cards.length === 0) {
		return (
			<div className="min-h-screen bg-background p-4 flex items-center justify-center">
				<Card className="max-w-md w-full">
					<CardHeader className="text-center">
						<CardTitle>No Flashcards</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<Empty>
							<EmptyHeader>
								<EmptyTitle>No flashcards found</EmptyTitle>
								<EmptyDescription>
									Upload questions for {selectedSubject} to study
								</EmptyDescription>
							</EmptyHeader>
						</Empty>
						<Button variant="outline" className="w-full" onClick={stopSession}>
							Go Back
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (sessionComplete) {
		const knownCount = knownCards.size;
		const reviewCount = reviewCards.size;
		const accuracy =
			totalCards > 0 ? Math.round((knownCount / totalCards) * 100) : 0;

		return (
			<div className="min-h-screen bg-background p-4 flex items-center justify-center">
				<Card className="max-w-md w-full">
					<CardHeader className="text-center">
						<CardTitle>Session Complete!</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-3 gap-4 text-center">
							<div className="p-4 rounded-lg bg-muted">
								<p className="text-2xl font-bold">{totalCards}</p>
								<p className="text-xs text-muted-foreground">Total</p>
							</div>
							<div className="p-4 rounded-lg bg-green-500/10">
								<p className="text-2xl font-bold text-green-500">
									{knownCount}
								</p>
								<p className="text-xs text-green-500">Known</p>
							</div>
							<div className="p-4 rounded-lg bg-amber-500/10">
								<p className="text-2xl font-bold text-amber-500">
									{reviewCount}
								</p>
								<p className="text-xs text-amber-500">Review</p>
							</div>
						</div>
						<div className="flex items-center justify-center gap-2">
							<Target className="size-4 text-green-500" />
							<span className="text-sm font-medium text-green-500">
								{accuracy}% accuracy
							</span>
						</div>
						<div className="flex gap-2">
							<Button
								variant="outline"
								className="flex-1"
								onClick={stopSession}
							>
								<Home className="size-4 mr-2" />
								Dashboard
							</Button>
							<Button className="flex-1" onClick={handleRestart}>
								<RotateCcw className="size-4 mr-2" />
								Try Again
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background p-4 flex flex-col">
			<div className="flex items-center justify-between mb-4">
				<Button variant="ghost" size="sm" onClick={stopSession}>
					Quit
				</Button>
				<div className="flex items-center gap-2">
					<Badge variant="outline">
						{currentIndex + 1} / {totalCards}
					</Badge>
					<Badge variant="secondary" className="text-green-500">
						{knownCards.size} known
					</Badge>
					<Badge variant="secondary" className="text-amber-500">
						{reviewCards.size} review
					</Badge>
				</div>
			</div>

			<div className="flex-1 flex items-center justify-center">
				<LazyMotion features={domAnimation}>
					<m.div
						className="perspective-1000 cursor-pointer w-full max-w-md"
						onClick={handleFlip}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault();
								handleFlip();
							}
						}}
						role="button"
						tabIndex={0}
						aria-label="Flip flashcard"
						initial={{ rotateY: 0 }}
						animate={{ rotateY: isFlipped ? 180 : 0 }}
						transition={{ duration: 0.5 }}
					>
						<Card
							className={cn(
								"absolute inset-0 backface-hidden p-6 flex flex-col",
								!isFlipped && "border-primary/50 bg-primary/5",
							)}
						>
							<div className="flex items-center gap-2 mb-4">
								<Badge variant="outline" className="bg-primary/10">
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
								<div className="mt-4 p-3 rounded-lg bg-amber-500/10">
									<p className="text-xs text-amber-700">
										Hint: {currentCard.hint}
									</p>
								</div>
							)}
						</Card>
					</m.div>
				</LazyMotion>
			</div>

			{isFlipped && (
				<div className="flex gap-2 mt-4">
					<Button
						variant="outline"
						className="flex-1 border-amber-500/50 text-amber-700"
						onClick={handleReview}
					>
						<IconX className="size-4 mr-2" />
						Review Later
					</Button>
					<Button className="flex-1" onClick={handleKnown}>
						<IconCheck className="size-4 mr-2" />I Know This
					</Button>
				</div>
			)}

			<div className="flex justify-between mt-4">
				<Button
					variant="ghost"
					onClick={previousCard}
					disabled={currentIndex === 0}
				>
					<ChevronLeft className="size-4 mr-2" />
					Previous
				</Button>
				<Button
					variant="ghost"
					onClick={nextCard}
					disabled={currentIndex === totalCards - 1}
				>
					Next
					<ChevronRight className="size-4 ml-2" />
				</Button>
			</div>
		</div>
	);
}
