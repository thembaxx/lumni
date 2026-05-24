"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	Confetti,
	GamificationCelebration,
	XPGainPopup,
} from "@/components/celebration";
import { LocalDataNotice } from "@/components/shared/local-data-notice";
import { useGamification } from "@/hooks/use-gamification";
import { useQuestionEngine } from "@/hooks/use-question-engine";
import { useWrongAnswerJournal } from "@/hooks/use-wrong-answer-journal";
import { trackQuestionResult } from "@/lib/orchestrator";
import { migrateLegacyFlashcards } from "@/lib/flashcard-repository/migrate";
import type { Question } from "@/lib/question-engine/types";
import {
	createFlashcard,
	getDueCards,
	getNewCards,
	reviewFlashcard,
} from "@/lib/utils/spaced-repetition";
import { FlashcardsActive } from "./flashcards-active";
import { FlashcardsEmpty } from "./flashcards-empty";
import { FlashcardsIdle } from "./flashcards-idle";
import { FlashcardsLoading } from "./flashcards-loading";
import { FlashcardsResults } from "./flashcards-results";

interface FlashcardItem {
	id: string;
	front: string;
	back: string;
	topic: string;
	difficulty: string;
	hint?: string;
	rawQuestion: Question;
}

type FlashcardSource = "ai" | "mistakes";

export function FlashcardsClient() {
	useEffect(() => {
		migrateLegacyFlashcards().catch((e) =>
			console.warn("Legacy flashcard migration:", e),
		);
	}, []);

	const [selectedSubject, setSelectedSubject] = useState<string>("");
	const [source, setSource] = useState<FlashcardSource>("ai");
	const [isActive, setIsActive] = useState(false);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [isFlipped, setIsFlipped] = useState(false);
	const [knownCards, setKnownCards] = useState<Set<string>>(new Set());
	const [reviewCards, setReviewCards] = useState<Set<string>>(new Set());
	const [mistakeCards, setMistakeCards] = useState<FlashcardItem[]>([]);
	const [sm2Cards, setSm2Cards] = useState<FlashcardItem[]>([]);
	const hasSm2Ref = useRef(false);
	const hintsRef = useRef<Map<string, string>>(new Map());
	const [sessionComplete, setSessionComplete] = useState(false);
	const [showConfetti, setShowConfetti] = useState(false);
	const [showXPGain, setShowXPGain] = useState(false);

	const gamification = useGamification();
	const { addWrongAnswer, getWrongAnswers } = useWrongAnswerJournal();

	const processSessionResults = useCallback(
		async (
			sessionCards: FlashcardItem[],
			known: Set<string>,
			subject: string,
		) => {
			const totalCards = sessionCards.length;
			const knownCount = known.size;
			const accuracy =
				totalCards > 0 ? Math.round((knownCount / totalCards) * 100) : 0;

			gamification.updateStreak();
			gamification.addXp(totalCards, accuracy, gamification.currentStreak);
			gamification.checkAndUnlockAchievements(
				gamification.totalQuestionsAnswered + totalCards,
				accuracy,
				gamification.currentStreak,
				gamification.levelInfo.level,
				accuracy === 100,
			);

			const isSm2Session =
				sessionCards.length > 0 && sessionCards[0].id.startsWith("fc_");

			const cardPromises: Promise<unknown>[] = [];
			for (const card of sessionCards) {
				const isKnown = known.has(card.id);
				const cardTopic = card.rawQuestion.topic;

				if (isSm2Session) {
					cardPromises.push(reviewFlashcard(card.id, isKnown ? 4 : 1));
				} else {
					trackQuestionResult({
						subjectId: subject,
						topicId: cardTopic,
						bloomLevel: card.rawQuestion.bloomTaxonomy,
						score: isKnown ? 1 : 0,
						maxScore: 1,
					});
				}

				if (!isKnown) {
					addWrongAnswer({
						questionId: card.id,
						questionText: card.front,
						subject,
						topic: cardTopic,
						correctAnswer: card.back,
						userAnswer: "",
						explanation: card.back,
					});
					if (!isSm2Session) {
						cardPromises.push(
							createFlashcard(card.front, card.back, subject, cardTopic),
						);
					}
				}
			}

			await Promise.all(cardPromises);
		},
		[gamification, addWrongAnswer],
	);

	const engineParams = useMemo(
		() => ({
			subject: selectedSubject.toLowerCase(),
			count: 20,
			questionType: "multiple-choice" as const,
		}),
		[selectedSubject],
	);

	const {
		questions,
		isLoading,
		hint: generateHint,
	} = useQuestionEngine(engineParams, {
		enabled:
			isActive && !!selectedSubject && source === "ai" && !hasSm2Ref.current,
	});

	const cards: FlashcardItem[] =
		isLoading === false && questions?.length
			? questions.reduce<FlashcardItem[]>((acc, q) => {
					if (!q?.id) return acc;
					acc.push({
						id: q.id,
						front: q.questionText,
						back: q.explanation,
						topic: q.topic,
						difficulty: q.difficulty,
						hint: hintsRef.current.get(q.id) || q.hint,
						rawQuestion: q,
					});
					return acc;
				}, [])
			: [];

	const sm2Available = source === "ai" && sm2Cards.length > 0;
	const displayCards = sm2Available
		? sm2Cards
		: source === "mistakes"
			? mistakeCards
			: cards;
	const totalCards = displayCards.length;

	const startSession = useCallback(
		async (subject: string, src: FlashcardSource = "ai") => {
			setSelectedSubject(subject);
			setSource(src);
			setIsActive(true);
			setCurrentIndex(0);
			setIsFlipped(false);
			setKnownCards(new Set());
			setReviewCards(new Set());
			setMistakeCards([]);
			setSm2Cards([]);
			setSessionComplete(false);

			if (src === "mistakes") {
				const wrongAnswers = await getWrongAnswers(subject.toLowerCase());
				setMistakeCards(
					wrongAnswers.map((wa) => ({
						id: wa.questionId,
						front: wa.questionText,
						back: wa.correctAnswer || wa.explanation,
						topic: wa.topic,
						difficulty: "Medium",
						hint: wa.explanation,
						rawQuestion: {
							id: wa.questionId,
							questionText: wa.questionText,
							explanation: wa.explanation,
							subject: wa.subject,
							topic: wa.topic,
							type: "short-answer",
							difficulty: "Medium",
							bloomTaxonomy: "understand",
							points: 1,
							body: { modelAnswer: wa.correctAnswer || wa.explanation },
						} as Question,
					})),
				);
			} else {
				const sm2Due = await getDueCards(subject.toLowerCase());
				const sm2New = await getNewCards(subject.toLowerCase(), 10);
				const allSm2 = [...sm2Due, ...sm2New];
				hasSm2Ref.current = allSm2.length > 0;
				if (allSm2.length > 0) {
					setSm2Cards(
						allSm2.map((c) => ({
							id: c.id,
							front: c.front,
							back: c.back,
							topic: c.topic ?? subject,
							difficulty: "Medium",
							rawQuestion: {
								id: c.id,
								questionText: c.front,
								explanation: c.back,
								subject: c.subject,
								topic: c.topic ?? subject,
								type: "short-answer",
								difficulty: "Medium",
								bloomTaxonomy: "understand",
								points: 1,
								body: { modelAnswer: c.back },
							} as Question,
						})),
					);
				}
			}
		},
		[getWrongAnswers],
	);

	const stopSession = useCallback(() => {
		setIsActive(false);
		setSelectedSubject("");
	}, []);

	const handleFlip = useCallback(() => {
		setIsFlipped((prev) => {
			if (!prev) {
				const card = displayCards[currentIndex];
				if (card && !hintsRef.current.has(card.id) && card.rawQuestion) {
					generateHint(card.rawQuestion)
						.then((hint) => {
							hintsRef.current.set(card.id, hint);
						})
						.catch((e) => console.warn("Hint generation:", e));
				}
			}
			return !prev;
		});
	}, [currentIndex, displayCards, generateHint]);

	const nextCard = useCallback(() => {
		if (currentIndex < displayCards.length - 1) {
			setCurrentIndex((prev) => prev + 1);
		} else {
			setSessionComplete(true);
			processSessionResults(
				displayCards,
				knownCards,
				selectedSubject.toLowerCase(),
			).catch((e) => console.warn("Session processing:", e));
		}
		setIsFlipped(false);
	}, [
		currentIndex,
		displayCards,
		knownCards,
		selectedSubject,
		processSessionResults,
	]);

	const handleKnown = useCallback(() => {
		const currentCard = displayCards[currentIndex];
		if (!currentCard) return;
		setKnownCards((prev) => new Set(prev).add(currentCard.id));
		setShowConfetti(true);
		setShowXPGain(true);
		setTimeout(() => setShowConfetti(false), 1500);
		setTimeout(() => setShowXPGain(false), 1000);
		nextCard();
	}, [displayCards, currentIndex, nextCard]);

	const handleReview = useCallback(() => {
		const currentCard = displayCards[currentIndex];
		if (!currentCard) return;
		setReviewCards((prev) => new Set(prev).add(currentCard.id));
		nextCard();
	}, [displayCards, currentIndex, nextCard]);

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
			<div className="flex flex-col gap-4">
				<LocalDataNotice
					page="flashcards"
					description="Your flashcards are saved on this device. Sign in to sync them across devices."
				/>
				<FlashcardsIdle
					onSelect={(subject) => startSession(subject, "ai")}
					onReviewMistakes={(subject) => startSession(subject, "mistakes")}
				/>
			</div>
		);
	}

	if (isLoading && source === "ai") {
		return <FlashcardsLoading />;
	}

	if (displayCards.length === 0) {
		return (
			<FlashcardsEmpty
				subject={selectedSubject}
				onGoBack={stopSession}
				mode={source}
			/>
		);
	}

	if (sessionComplete) {
		return (
			<FlashcardsResults
				totalCards={totalCards}
				knownCount={knownCards.size}
				reviewCount={reviewCards.size}
				onGoHouse={stopSession}
				onRestart={handleRestart}
			/>
		);
	}

	return (
		<>
			<GamificationCelebration />
			<Confetti trigger={showConfetti} count={20} duration={1200} />
			<XPGainPopup amount={10} visible={showXPGain} />
			<FlashcardsActive
				cards={displayCards}
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
