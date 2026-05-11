"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Confetti, XPGainPopup } from "@/components/celebration";
import { useQuestionEngine } from "@/hooks/use-question-engine";
import { FlashcardsActive } from "./flashcards-active";
import { FlashcardsEmpty } from "./flashcards-empty";
import { FlashcardsIdle } from "./flashcards-idle";
import { FlashcardsLoading } from "./flashcards-loading";
import { FlashcardsResults } from "./flashcards-results";
import type { Question } from "@/types/questions";

interface FlashcardItem {
	id: string;
	front: string;
	back: string;
	topic: string;
	difficulty: string;
	hint?: string;
	rawQuestion: Question;
}

export function FlashcardsClient() {
	const [selectedSubject, setSelectedSubject] = useState<string>("");
	const [isActive, setIsActive] = useState(false);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [isFlipped, setIsFlipped] = useState(false);
	const [knownCards, setKnownCards] = useState<Set<string>>(new Set());
	const [reviewCards, setReviewCards] = useState<Set<string>>(new Set());
	const hintsRef = useRef<Map<string, string>>(new Map());
	const [sessionComplete, setSessionComplete] = useState(false);
	const [showConfetti, setShowConfetti] = useState(false);
	const [showXPGain, setShowXPGain] = useState(false);

	const engineParams = useMemo(
		() => ({
			subject: selectedSubject.toLowerCase(),
			count: 20,
			questionType: "multiple-choice" as const,
		}),
		[selectedSubject],
	);

	const { questions, isLoading, hint: generateHint, isGeneratingHint } = useQuestionEngine(engineParams, {
		enabled: isActive && !!selectedSubject,
	});

	const cards: FlashcardItem[] =
		isLoading === false && questions?.length
			? questions
					.filter((q) => q && q.id)
					.map((q) => ({
						id: q.id,
						front: q.questionText,
						back: q.explanation,
						topic: q.topic,
						difficulty: q.difficulty,
						hint: hintsRef.current.get(q.id) || q.hint,
						rawQuestion: q,
					}))
			: [];

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
		setIsFlipped((prev) => {
			if (!prev) {
				const card = cards[currentIndex];
				if (card && !hintsRef.current.has(card.id) && card.rawQuestion) {
					generateHint(card.rawQuestion).then((hint) => {
						hintsRef.current.set(card.id, hint);
					}).catch(() => {});
				}
			}
			return !prev;
		});
	}, [currentIndex, cards, generateHint]);

	const nextCard = useCallback(() => {
		if (currentIndex < cards.length - 1) {
			setCurrentIndex((prev) => prev + 1);
		} else {
			setSessionComplete(true);
		}
		setIsFlipped(false);
	}, [currentIndex, cards.length]);

	const handleKnown = useCallback(() => {
		const currentCard = cards[currentIndex];
		if (!currentCard) return;
		setKnownCards((prev) => new Set(prev).add(currentCard.id));
		setShowConfetti(true);
		setShowXPGain(true);
		setTimeout(() => setShowConfetti(false), 1500);
		setTimeout(() => setShowXPGain(false), 1000);
		nextCard();
	}, [cards, currentIndex, nextCard]);

	const handleReview = useCallback(() => {
		const currentCard = cards[currentIndex];
		if (!currentCard) return;
		setReviewCards((prev) => new Set(prev).add(currentCard.id));
		nextCard();
	}, [cards, currentIndex, nextCard]);

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
		return <FlashcardsIdle onSelect={startSession} />;
	}

	if (isLoading) {
		return <FlashcardsLoading />;
	}

	if (cards.length === 0) {
		return <FlashcardsEmpty subject={selectedSubject} onGoBack={stopSession} />;
	}

	if (sessionComplete) {
		return (
			<FlashcardsResults
				totalCards={totalCards}
				knownCount={knownCards.size}
				reviewCount={reviewCards.size}
				onGoHome={stopSession}
				onRestart={handleRestart}
			/>
		);
	}

	return (
		<>
			<Confetti trigger={showConfetti} count={20} duration={1200} />
			<XPGainPopup amount={10} visible={showXPGain} />
			<FlashcardsActive
				cards={cards}
				currentIndex={currentIndex}
				isFlipped={isFlipped}
				knownCount={knownCards.size}
				reviewCount={reviewCards.size}
				onFlip={handleFlip}
				onKnown={handleKnown}
				onReview={handleReview}
				onPrevious={previousCard}
				onNext={nextCard}
				onQuit={stopSession}
			/>
		</>
	);
}
