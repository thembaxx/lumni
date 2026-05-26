"use client";

import { useCallback, useEffect, useState } from "react";
import type { FlashcardSM2 } from "@/lib/flashcard-engine";
import { flashcardEngine } from "@/lib/flashcard-engine";

export interface UseSpacedRepetitionReturn {
	cards: FlashcardSM2[];
	dueCards: FlashcardSM2[];
	newCards: FlashcardSM2[];
	stats: {
		total: number;
		due: number;
		learning: number;
		mature: number;
		new: number;
		avgEaseFactor: number;
	};
	groupedCards: Record<string, FlashcardSM2[]>;
	addCard: (
		front: string,
		back: string,
		subject: string,
		topic?: string,
	) => Promise<void>;
	removeCard: (id: string) => Promise<void>;
	editCard: (id: string, updates: Partial<FlashcardSM2>) => Promise<void>;
	review: (id: string, quality: number) => Promise<void>;
	importFromQuiz: (
		questions: Array<{
			id: string;
			questionText: string;
			options: Array<{ text: string; isCorrect: boolean }>;
			explanation: string;
		}>,
		subject: string,
	) => Promise<void>;
	bury: (id: string) => Promise<void>;
	suspend: (id: string) => Promise<void>;
	activate: (id: string) => Promise<void>;
	getReviewHistory: (
		cardId: string,
	) => Promise<import("@/lib/flashcard-engine").FlashcardReview[]>;
	refresh: () => Promise<void>;
}

export function useSpacedRepetition(): UseSpacedRepetitionReturn {
	const [cards, setCards] = useState<FlashcardSM2[]>([]);
	const [dueCards, setDueCards] = useState<FlashcardSM2[]>([]);
	const [newCards, setNewCards] = useState<FlashcardSM2[]>([]);
	const [stats, setStats] = useState<{
		total: number;
		due: number;
		learning: number;
		mature: number;
		new: number;
		avgEaseFactor: number;
	}>({ total: 0, due: 0, learning: 0, mature: 0, new: 0, avgEaseFactor: 2.5 });
	const [groupedCards, setGroupedCards] = useState<
		Record<string, FlashcardSM2[]>
	>({});

	const refresh = useCallback(async () => {
		setCards(await flashcardEngine.getAll());
		setDueCards(await flashcardEngine.getDueCards());
		setNewCards(await flashcardEngine.getNewCards());
		setStats(await flashcardEngine.getStats());
		setGroupedCards(await flashcardEngine.getGrouped());
	}, []);

	useEffect(() => {
		refresh();
	}, [refresh]);

	const addCard = useCallback(
		async (front: string, back: string, subject: string, topic?: string) => {
			await flashcardEngine.create(front, back, subject, topic);
			await refresh();
		},
		[refresh],
	);

	const removeCard = useCallback(
		async (id: string) => {
			await flashcardEngine.delete(id);
			await refresh();
		},
		[refresh],
	);

	const editCard = useCallback(
		async (id: string, updates: Partial<FlashcardSM2>) => {
			await flashcardEngine.update(id, updates);
			await refresh();
		},
		[refresh],
	);

	const review = useCallback(
		async (id: string, quality: number) => {
			await flashcardEngine.review(id, quality);
			await refresh();
		},
		[refresh],
	);

	const bury = useCallback(
		async (id: string) => {
			await flashcardEngine.bury(id);
			await refresh();
		},
		[refresh],
	);

	const suspend = useCallback(
		async (id: string) => {
			await flashcardEngine.suspend(id);
			await refresh();
		},
		[refresh],
	);

	const activate = useCallback(
		async (id: string) => {
			await flashcardEngine.activate(id);
			await refresh();
		},
		[refresh],
	);

	const getReviewHistory_ = useCallback(async (cardId: string) => {
		return flashcardEngine.getReviewHistory(cardId);
	}, []);

	const importFromQuiz = useCallback(
		async (
			questions: Array<{
				id: string;
				questionText: string;
				options: Array<{ text: string; isCorrect: boolean }>;
				explanation: string;
			}>,
			subject: string,
		) => {
			await flashcardEngine.convertQuizToFlashcards(questions, subject);
			await refresh();
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
		bury,
		suspend,
		activate,
		getReviewHistory: getReviewHistory_,
		refresh,
	};
}
