import { flashcardRepository } from "@/lib/flashcard-repository";
import type {
	FlashcardSM2,
	SM2Quality,
} from "@/lib/flashcard-repository/types";
import { SM2_QUALITIES } from "@/lib/flashcard-repository/types";

export type { FlashcardSM2, SM2Quality };
export { SM2_QUALITIES };

export function loadFlashcards(): FlashcardSM2[] {
	void flashcardRepository;
	return [];
}

export function saveFlashcards(_cards: FlashcardSM2[]): void {
	void _cards;
}

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

export function calculateNextReview(
	quality: number,
	currentEaseFactor: number,
	currentInterval: number,
	currentRepetitions: number,
): { easeFactor: number; interval: number; repetitions: number } {
	let easeFactor = currentEaseFactor;
	let interval = currentInterval;
	let repetitions = currentRepetitions;

	easeFactor =
		easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
	easeFactor = Math.max(1.3, easeFactor);

	if (quality < 3) {
		repetitions = 0;
		interval = 1;
	} else {
		repetitions += 1;

		if (repetitions === 1) {
			interval = 1;
		} else if (repetitions === 2) {
			interval = 6;
		} else {
			interval = Math.round(currentInterval * easeFactor);
		}
	}

	return {
		easeFactor: Math.round(easeFactor * 100) / 100,
		interval,
		repetitions,
	};
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

export async function convertQuizToFlashcards(
	questions: Array<{
		id: string;
		questionText: string;
		options: Array<{ text: string; isCorrect: boolean }>;
		explanation: string;
	}>,
	subject: string,
): Promise<FlashcardSM2[]> {
	const newCards: FlashcardSM2[] = [];

	for (const q of questions) {
		const correctOption = q.options.find((o) => o.isCorrect);
		if (!correctOption) continue;

		const card = await flashcardRepository.create(
			q.questionText,
			correctOption.text,
			subject,
			q.id,
		);
		newCards.push(card);
	}

	return newCards;
}
