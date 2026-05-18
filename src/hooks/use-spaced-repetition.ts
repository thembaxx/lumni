"use client";

import { useCallback, useEffect, useState } from "react";
import { flashcardRepository } from "@/lib/flashcard-repository";
import type { FlashcardSM2 } from "@/lib/flashcard-repository/types";
import {
	convertQuizToFlashcards,
	type SM2Quality,
} from "@/lib/utils/spaced-repetition";

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
		setCards(await flashcardRepository.getAll());
		setDueCards(await flashcardRepository.getDueCards());
		setNewCards(await flashcardRepository.getNewCards());
		setStats(await flashcardRepository.getStats());
		setGroupedCards(await flashcardRepository.getGrouped());
	}, []);

	useEffect(() => {
		refresh();
	}, [refresh]);

	const addCard = useCallback(
		async (front: string, back: string, subject: string, topic?: string) => {
			await flashcardRepository.create(front, back, subject, topic);
			await refresh();
		},
		[refresh],
	);

	const removeCard = useCallback(
		async (id: string) => {
			await flashcardRepository.delete(id);
			await refresh();
		},
		[refresh],
	);

	const editCard = useCallback(
		async (id: string, updates: Partial<FlashcardSM2>) => {
			await flashcardRepository.update(id, updates);
			await refresh();
		},
		[refresh],
	);

	const review = useCallback(
		async (id: string, quality: number) => {
			await flashcardRepository.review(id, quality);
			await refresh();
		},
		[refresh],
	);

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
			await convertQuizToFlashcards(questions, subject);
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
		refresh,
	};
}
