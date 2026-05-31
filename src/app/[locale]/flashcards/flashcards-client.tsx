"use client";

import { useTranslations } from "next-intl";
import {
	useCallback,
	useEffect,
	useMemo,
	useReducer,
	useRef,
	useState,
} from "react";
import {
	Confetti,
	GamificationCelebration,
	XPGainPopup,
} from "@/components/celebration";
import { LocalDataNotice } from "@/components/shared/local-data-notice";
import { useGamification } from "@/hooks/use-gamification";
import { useQuestionEngine } from "@/hooks/use-question-engine";
import { toast } from "@/hooks/use-toast";
import { useWrongAnswerJournal } from "@/hooks/use-wrong-answer-journal";
import { competencyService } from "@/lib/competency-engine/competency-service";
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

interface SessionState {
	selectedSubject: string;
	source: FlashcardSource;
	isActive: boolean;
	sessionComplete: boolean;
}

const initialSessionState: SessionState = {
	selectedSubject: "",
	source: "ai",
	isActive: false,
	sessionComplete: false,
};

type SessionAction =
	| {
			type: "START_SESSION";
			payload: { subject: string; source: FlashcardSource };
	  }
	| { type: "STOP_SESSION" }
	| { type: "COMPLETE_SESSION" }
	| { type: "RESTART" };

function sessionReducer(
	state: SessionState,
	action: SessionAction,
): SessionState {
	switch (action.type) {
		case "START_SESSION":
			return {
				...state,
				selectedSubject: action.payload.subject,
				source: action.payload.source,
				isActive: true,
				sessionComplete: false,
			};
		case "STOP_SESSION":
			return { ...state, isActive: false, selectedSubject: "" };
		case "COMPLETE_SESSION":
			return { ...state, sessionComplete: true };
		case "RESTART":
			return { ...state, sessionComplete: false };
		default:
			return state;
	}
}

interface CardsState {
	mistakeCards: FlashcardItem[];
	sm2Cards: FlashcardItem[];
	qualityMap: Map<string, number>;
}

const initialCardsState: CardsState = {
	mistakeCards: [],
	sm2Cards: [],
	qualityMap: new Map(),
};

type CardsAction =
	| { type: "SET_MISTAKE_CARDS"; payload: FlashcardItem[] }
	| { type: "SET_SM2_CARDS"; payload: FlashcardItem[] }
	| { type: "RESET" }
	| { type: "SET_QUALITY"; payload: { cardId: string; quality: number } };

function cardsReducer(state: CardsState, action: CardsAction): CardsState {
	switch (action.type) {
		case "SET_MISTAKE_CARDS":
			return { ...state, mistakeCards: action.payload };
		case "SET_SM2_CARDS":
			return { ...state, sm2Cards: action.payload };
		case "RESET":
			return {
				...state,
				mistakeCards: [],
				sm2Cards: [],
				qualityMap: new Map(),
			};
		case "SET_QUALITY":
			return {
				...state,
				qualityMap: new Map(state.qualityMap).set(
					action.payload.cardId,
					action.payload.quality,
				),
			};
		default:
			return state;
	}
}

export function FlashcardsClient() {
	const t = useTranslations();
	useEffect(() => {
		migrateLegacyFlashcards().catch((e) => {
			console.warn("Legacy flashcard migration:", e);
			toast({
				type: "warning",
				message: "Could not migrate legacy flashcards",
			});
		});
		void enqueue("appwrite-flashcard-pull", {}).catch((e) => {
			console.warn("Flashcard pull failed:", e);
			toast({
				type: "warning",
				message: "Could not sync flashcards from cloud",
			});
		});
	}, []);

	const [session, dispatchSession] = useReducer(
		sessionReducer,
		initialSessionState,
	);
	const [cards, dispatchCards] = useReducer(cardsReducer, initialCardsState);
	const hasSm2Ref = useRef(false);
	const [showConfetti, setShowConfetti] = useState(false);
	const [showXPGain, setShowXPGain] = useState(false);

	const gamification = useGamification();
	const { addWrongAnswer, getWrongAnswers } = useWrongAnswerJournal();

	const knownCount = Array.from(cards.qualityMap.values()).filter(
		(q) => q >= 3,
	).length;
	const reviewCount = cards.qualityMap.size - knownCount;

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
			subject: session.selectedSubject.toLowerCase(),
			count: 20,
			questionType: "multiple-choice" as const,
		}),
		[session.selectedSubject],
	);

	const { questions, isLoading } = useQuestionEngine(engineParams, {
		enabled:
			session.isActive &&
			!!session.selectedSubject &&
			session.source === "ai" &&
			!hasSm2Ref.current,
	});

	const generatedCards: FlashcardItem[] =
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

	const sm2Available = session.source === "ai" && cards.sm2Cards.length > 0;
	const displayCards = sm2Available
		? cards.sm2Cards
		: session.source === "mistakes"
			? cards.mistakeCards
			: generatedCards;
	const totalCards = displayCards.length;

	const startSession = useCallback(
		async (subject: string, src: FlashcardSource = "ai") => {
			dispatchSession({
				type: "START_SESSION",
				payload: { subject, source: src },
			});
			dispatchCards({ type: "RESET" });

			if (src === "mistakes") {
				const wrongAnswers = await getWrongAnswers(subject.toLowerCase());
				dispatchCards({
					type: "SET_MISTAKE_CARDS",
					payload: wrongAnswers.map((wa) => ({
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
				});
			} else {
				const sm2Due = await flashcardEngine.getDueCards(subject.toLowerCase());
				const sm2New = await flashcardEngine.getNewCards(
					subject.toLowerCase(),
					10,
				);
				const allSm2 = [...sm2Due, ...sm2New];
				hasSm2Ref.current = allSm2.length > 0;
				if (allSm2.length > 0) {
					try {
						const competencies = await competencyService.getCompetencies(
							subject.toLowerCase(),
						);
						const topicScores = new Map<string, number>();
						for (const c of competencies) {
							const cur = topicScores.get(c.topicId) ?? 0;
							topicScores.set(c.topicId, cur + c.score);
						}
						for (const [topicId, total] of topicScores) {
							const count = competencies.filter(
								(c) => c.topicId === topicId,
							).length;
							topicScores.set(topicId, total / count);
						}
						allSm2.sort((a, b) => {
							const aScore = topicScores.get(a.topic ?? "") ?? 100;
							const bScore = topicScores.get(b.topic ?? "") ?? 100;
							if (aScore !== bScore) return aScore - bScore;
							return (a.nextReview ?? 0) - (b.nextReview ?? 0);
						});
					} catch {
						// Fall back to default ordering
					}
					dispatchCards({
						type: "SET_SM2_CARDS",
						payload: allSm2.map((c) => ({
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
					});
				}
			}
		},
		[getWrongAnswers],
	);

	const stopSession = useCallback(() => {
		dispatchSession({ type: "STOP_SESSION" });
	}, []);

	const handleReview = useCallback((cardId: string, quality: number) => {
		dispatchCards({ type: "SET_QUALITY", payload: { cardId, quality } });
		if (quality >= 3) {
			setShowConfetti(true);
			setShowXPGain(true);
			setTimeout(() => setShowConfetti(false), 1500);
			setTimeout(() => setShowXPGain(false), 1000);
		}
	}, []);

	const handleSessionComplete = useCallback(() => {
		dispatchSession({ type: "COMPLETE_SESSION" });
		processSessionResults(
			displayCards,
			cards.qualityMap,
			session.selectedSubject.toLowerCase(),
		).catch((e) => {
			console.warn("Session processing:", e);
			toast({
				type: "error",
				message: "Session results may not be fully saved.",
			});
		});
	}, [
		displayCards,
		cards.qualityMap,
		session.selectedSubject,
		processSessionResults,
	]);

	const handleRestart = useCallback(() => {
		dispatchCards({ type: "RESET" });
		dispatchSession({ type: "RESTART" });
	}, []);

	if (!session.isActive) {
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

	if (isLoading && session.source === "ai") {
		return <FlashcardsLoading />;
	}

	if (displayCards.length === 0) {
		return (
			<FlashcardsEmpty
				subject={session.selectedSubject}
				onGoBack={stopSession}
				mode={session.source}
			/>
		);
	}

	if (session.sessionComplete) {
		return (
			<FlashcardsResults
				totalCards={totalCards}
				knownCount={knownCount}
				reviewCount={reviewCount}
				subject={session.selectedSubject || "Flashcards"}
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
