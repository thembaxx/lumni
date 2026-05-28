"use client";

import { useTranslations } from "next-intl";
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
import { flashcardEngine } from "@/lib/flashcard-engine";
import { migrateLegacyFlashcards } from "@/lib/flashcard-repository/migrate";
import { trackQuestionResult } from "@/lib/orchestrator";
import { enqueue } from "@/lib/orchestrator/job-queue";
import type { Question } from "@/lib/question-engine/types";
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
	const t = useTranslations();
	useEffect(() => {
		migrateLegacyFlashcards().catch((e) =>
			console.warn("Legacy flashcard migration:", e),
		);
		void enqueue("appwrite-flashcard-pull", {}).catch((e) =>
			console.warn("Flashcard pull failed:", e),
		);
	}, []);

	const [selectedSubject, setSelectedSubject] = useState<string>("");
	const [source, setSource] = useState<FlashcardSource>("ai");
	const [isActive, setIsActive] = useState(false);
	const [qualityMap, setQualityMap] = useState<Map<string, number>>(new Map());
	const [mistakeCards, setMistakeCards] = useState<FlashcardItem[]>([]);
	const [sm2Cards, setSm2Cards] = useState<FlashcardItem[]>([]);
	const hasSm2Ref = useRef(false);
	const [sessionComplete, setSessionComplete] = useState(false);
	const [showConfetti, setShowConfetti] = useState(false);
	const [showXPGain, setShowXPGain] = useState(false);

	const gamification = useGamification();
	const { addWrongAnswer, getWrongAnswers } = useWrongAnswerJournal();

	const knownCount = Array.from(qualityMap.values()).filter(
		(q) => q >= 3,
	).length;
	const reviewCount = qualityMap.size - knownCount;

	const processSessionResults = useCallback(
		async (
			sessionCards: FlashcardItem[],
			qualities: Map<string, number>,
			subject: string,
		) => {
			const totalCards = sessionCards.length;
			const passedCount = Array.from(qualities.values()).filter(
				(q) => q >= 3,
			).length;
			const accuracy =
				totalCards > 0 ? Math.round((passedCount / totalCards) * 100) : 0;

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
				const quality = qualities.get(card.id) ?? 0;
				const isKnown = quality >= 3;
				const cardTopic = card.rawQuestion.topic;

				if (isSm2Session) {
					cardPromises.push(flashcardEngine.review(card.id, quality));
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
							flashcardEngine.create(card.front, card.back, subject, cardTopic),
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

	const { questions, isLoading } = useQuestionEngine(engineParams, {
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
						hint: q.hint,
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
			setQualityMap(new Map());
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
				const sm2Due = await flashcardEngine.getDueCards(subject.toLowerCase());
				const sm2New = await flashcardEngine.getNewCards(
					subject.toLowerCase(),
					10,
				);
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

	const handleReview = useCallback((cardId: string, quality: number) => {
		setQualityMap((prev) => new Map(prev).set(cardId, quality));
		if (quality >= 3) {
			setShowConfetti(true);
			setShowXPGain(true);
			setTimeout(() => setShowConfetti(false), 1500);
			setTimeout(() => setShowXPGain(false), 1000);
		}
	}, []);

	const handleSessionComplete = useCallback(() => {
		setSessionComplete(true);
		processSessionResults(
			displayCards,
			qualityMap,
			selectedSubject.toLowerCase(),
		).catch((e) => console.warn("Session processing:", e));
	}, [displayCards, qualityMap, selectedSubject, processSessionResults]);

	const handleRestart = useCallback(() => {
		setQualityMap(new Map());
		setSessionComplete(false);
	}, []);

	if (!isActive) {
		return (
			<div className="flex flex-col gap-4">
				<LocalDataNotice
					page="flashcards"
					description={t("flashcards.localDataNotice")}
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
				knownCount={knownCount}
				reviewCount={reviewCount}
				subject={selectedSubject || "Flashcards"}
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
				knownCount={knownCount}
				reviewCount={reviewCount}
				onReview={handleReview}
				onComplete={handleSessionComplete}
				onQuit={stopSession}
			/>
		</>
	);
}
