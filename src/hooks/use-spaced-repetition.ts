"use client";

import { useCallback, useEffect, useState } from "react";
import {
	convertQuizToFlashcards,
	createFlashcard,
	deleteFlashcard,
	FlashcardSM2,
	getAllCardsGrouped,
	getCardStats,
	getDueCards,
	getNewCards,
	loadFlashcards,
	reviewFlashcard,
	type SM2Quality,
	saveFlashcards,
	updateFlashcard,
} from "@/lib/utils/spaced-repetition";

export interface UseSpacedRepetitionReturn {
	cards: FlashcardSM2[];
	dueCards: FlashcardSM2[];
	newCards: FlashcardSM2[];
	stats: ReturnType<typeof getCardStats>;
	groupedCards: Record<string, FlashcardSM2[]>;
	addCard: (
		front: string,
		back: string,
		subject: string,
		topic?: string,
	) => void;
	removeCard: (id: string) => void;
	editCard: (id: string, updates: Partial<FlashcardSM2>) => void;
	review: (id: string, quality: number) => void;
	importFromQuiz: (
		questions: Array<{
			id: string;
			questionText: string;
			options: Array<{ text: string; isCorrect: boolean }>;
			explanation: string;
		}>,
		subject: string,
	) => void;
	refresh: () => void;
}

export function useSpacedRepetition(): UseSpacedRepetitionReturn {
	const [cards, setCards] = useState<FlashcardSM2[]>([]);
	const [dueCards, setDueCards] = useState<FlashcardSM2[]>([]);
	const [newCards, setNewCards] = useState<FlashcardSM2[]>([]);
	const [stats, setStats] = useState(getCardStats());
	const [groupedCards, setGroupedCards] = useState<
		Record<string, FlashcardSM2[]>
	>({});

	const refresh = useCallback(() => {
		setCards(loadFlashcards());
		setDueCards(getDueCards());
		setNewCards(getNewCards());
		setStats(getCardStats());
		setGroupedCards(getAllCardsGrouped());
	}, []);

	useEffect(() => {
		refresh();
	}, [refresh]);

	const addCard = useCallback(
		(front: string, back: string, subject: string, topic?: string) => {
			createFlashcard(front, back, subject, topic);
			refresh();
		},
		[refresh],
	);

	const removeCard = useCallback(
		(id: string) => {
			deleteFlashcard(id);
			refresh();
		},
		[refresh],
	);

	const editCard = useCallback(
		(id: string, updates: Partial<FlashcardSM2>) => {
			updateFlashcard(id, updates);
			refresh();
		},
		[refresh],
	);

	const review = useCallback(
		(id: string, quality: number) => {
			reviewFlashcard(id, quality);
			refresh();
		},
		[refresh],
	);

	const importFromQuiz = useCallback(
		(
			questions: Array<{
				id: string;
				questionText: string;
				options: Array<{ text: string; isCorrect: boolean }>;
				explanation: string;
			}>,
			subject: string,
		) => {
			convertQuizToFlashcards(questions, subject);
			refresh();
		},
		[refresh],
	);

	return {
		cards,
		dueCards,
		newCards,
		stats,
		groupedCards,
		addCard,
		removeCard,
		editCard,
		review,
		importFromQuiz,
		refresh,
	};
}
