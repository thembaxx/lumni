import { flashcardRepository } from "@/lib/flashcard-repository";
import type {
	CardStatus,
	FlashcardReview,
	FlashcardSM2,
	SM2Quality,
	SRSAlgorithm,
} from "@/lib/flashcard-repository/types";
import { SM2_QUALITIES } from "@/lib/flashcard-repository/types";
import type { SRSettings } from "@/lib/spaced-repetition";
import {
	DEFAULT_SR_SETTINGS,
	loadSRSettings,
	resetDailyBudget,
	resetSRSettings,
	saveSRSettings,
} from "@/lib/spaced-repetition";

export {
	calculateNextReviewFSRS,
	getRetrievability,
	initFSRS,
} from "@/lib/orchestrator/fsrs";
export {
	calculateNextReview,
	computeNextReviewDate,
} from "@/lib/orchestrator/sm2";
export type {
	CardStatus,
	FlashcardReview,
	FlashcardSM2,
	SM2Quality,
	SRSAlgorithm,
	SRSettings,
};
export {
	DEFAULT_SR_SETTINGS,
	loadSRSettings,
	resetDailyBudget,
	resetSRSettings,
	SM2_QUALITIES,
	saveSRSettings,
};

export async function createFlashcard(
	front: string,
	back: string,
	subject: string,
	topic?: string,
): Promise<FlashcardSM2> {
	return flashcardRepository.create(front, back, subject, topic);
}

export async function deleteFlashcard(id: string): Promise<void> {
	return flashcardRepository.delete(id);
}

export async function updateFlashcard(
	id: string,
	updates: Partial<FlashcardSM2>,
): Promise<void> {
	return flashcardRepository.update(id, updates);
}

export async function reviewFlashcard(
	id: string,
	quality: number,
): Promise<FlashcardSM2 | null> {
	return flashcardRepository.review(id, quality);
}

export async function getDueCards(subject?: string): Promise<FlashcardSM2[]> {
	return flashcardRepository.getDueCards(subject);
}

export async function getNewCards(
	subject?: string,
	limit: number = 20,
): Promise<FlashcardSM2[]> {
	return flashcardRepository.getNewCards(subject, limit);
}

export async function getAllCardsGrouped(): Promise<
	Record<string, FlashcardSM2[]>
> {
	return flashcardRepository.getGrouped();
}

export async function getCardStats(): Promise<{
	total: number;
	due: number;
	learning: number;
	mature: number;
	new: number;
	avgEaseFactor: number;
}> {
	return flashcardRepository.getStats();
}

export function getMasteryLevel(
	interval: number,
): "new" | "learning" | "reviewing" | "mastered" {
	if (interval === 0) return "new";
	if (interval < 7) return "learning";
	if (interval < 21) return "reviewing";
	return "mastered";
}

export function getIntervalLabel(interval: number): string {
	if (interval === 0) return "New";
	if (interval === 1) return "1 day";
	if (interval < 7) return `${interval} days`;
	if (interval < 30) return `${Math.round(interval / 7)} weeks`;
	if (interval < 365) return `${Math.round(interval / 30)} months`;
	return `${Math.round(interval / 365)} years`;
}

export async function buryFlashcard(id: string): Promise<void> {
	return flashcardRepository.bury(id);
}

export async function suspendFlashcard(id: string): Promise<void> {
	return flashcardRepository.suspend(id);
}

export async function activateFlashcard(id: string): Promise<void> {
	return flashcardRepository.activate(id);
}

export async function getReviewHistory(
	cardId: string,
): Promise<FlashcardReview[]> {
	return flashcardRepository.getReviewHistory(cardId);
}

export async function convertQuizToFlashcards(
	questions: Array<{
		id: string;
		questionText: string;
		options: Array<{ text: string; isCorrect: boolean }>;
		explanation: string;
	}>,
	subject: string,
): Promise<FlashcardSM2[]> {
	const newCards = await Promise.all(
		questions.flatMap((q) => {
			const correctOption = q.options.find((o) => o.isCorrect);
			if (!correctOption) return [];
			return [
				flashcardRepository.create(
					q.questionText,
					correctOption.text,
					subject,
					q.id,
				),
			];
		}),
	);

	return newCards;
}
