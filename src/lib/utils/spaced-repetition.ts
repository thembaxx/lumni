import { loadFromStorage, saveToStorage } from "./storage";

export interface FlashcardSM2 {
	id: string;
	front: string;
	back: string;
	subject: string;
	topic?: string;
	easeFactor: number;
	interval: number;
	repetitions: number;
	nextReview: number;
	lastReview: number | null;
	createdAt: number;
}

export interface SM2Quality {
	quality: number;
	label: string;
	description: string;
}

export const SM2_QUALITIES: SM2Quality[] = [
	{
		quality: 0,
		label: "Complete Blackout",
		description: "Couldn't recall at all",
	},
	{
		quality: 1,
		label: "Incorrect - Remembered",
		description: "Got it wrong but remembered after",
	},
	{
		quality: 2,
		label: "Incorrect - Easy",
		description: "Got it wrong, answer seemed easy after",
	},
	{
		quality: 3,
		label: "Correct - Hard",
		description: "Got it right with serious difficulty",
	},
	{
		quality: 4,
		label: "Correct - Good",
		description: "Got it right with some hesitation",
	},
	{
		quality: 5,
		label: "Correct - Easy",
		description: "Got it right instantly and easily",
	},
];

const FLASHCARD_DATA_KEY = "lumni_flashcards_sm2";

export function loadFlashcards(): FlashcardSM2[] {
	return loadFromStorage<FlashcardSM2[]>(FLASHCARD_DATA_KEY, []);
}

export function saveFlashcards(cards: FlashcardSM2[]): void {
	saveToStorage(FLASHCARD_DATA_KEY, cards);
}

export function createFlashcard(
	front: string,
	back: string,
	subject: string,
	topic?: string,
): FlashcardSM2 {
	const cards = loadFlashcards();
	const newCard: FlashcardSM2 = {
		id: `fc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
		front,
		back,
		subject,
		topic,
		easeFactor: 2.5,
		interval: 0,
		repetitions: 0,
		nextReview: Date.now(),
		lastReview: null,
		createdAt: Date.now(),
	};
	cards.push(newCard);
	saveFlashcards(cards);
	return newCard;
}

export function deleteFlashcard(id: string): void {
	const cards = loadFlashcards().filter((c) => c.id !== id);
	saveFlashcards(cards);
}

export function updateFlashcard(
	id: string,
	updates: Partial<FlashcardSM2>,
): void {
	const cards = loadFlashcards();
	const index = cards.findIndex((c) => c.id === id);
	if (index >= 0) {
		cards[index] = { ...cards[index], ...updates };
		saveFlashcards(cards);
	}
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

export function reviewFlashcard(
	id: string,
	quality: number,
): FlashcardSM2 | null {
	const cards = loadFlashcards();
	const card = cards.find((c) => c.id === id);

	if (!card) return null;

	const { easeFactor, interval, repetitions } = calculateNextReview(
		quality,
		card.easeFactor,
		card.interval,
		card.repetitions,
	);

	const nextReview = Date.now() + interval * 24 * 60 * 60 * 1000;

	const updatedCard: FlashcardSM2 = {
		...card,
		easeFactor,
		interval,
		repetitions,
		nextReview,
		lastReview: Date.now(),
	};

	const index = cards.findIndex((c) => c.id === id);
	cards[index] = updatedCard;
	saveFlashcards(cards);

	return updatedCard;
}

export function getDueCards(subject?: string): FlashcardSM2[] {
	const cards = loadFlashcards();
	const now = Date.now();

	return cards
		.filter((card) => {
			const isDue = card.nextReview <= now;
			const matchesSubject = !subject || card.subject === subject;
			return isDue && matchesSubject;
		})
		.sort((a, b) => a.nextReview - b.nextReview);
}

export function getNewCards(
	subject?: string,
	limit: number = 20,
): FlashcardSM2[] {
	const cards = loadFlashcards();

	return cards
		.filter((card) => {
			const isNew = card.repetitions === 0;
			const matchesSubject = !subject || card.subject === subject;
			return isNew && matchesSubject;
		})
		.slice(0, limit);
}

export function getAllCardsGrouped(): Record<string, FlashcardSM2[]> {
	const cards = loadFlashcards();
	const grouped: Record<string, FlashcardSM2[]> = {};

	cards.forEach((card) => {
		if (!grouped[card.subject]) {
			grouped[card.subject] = [];
		}
		grouped[card.subject].push(card);
	});

	return grouped;
}

export function getCardStats(): {
	total: number;
	due: number;
	learning: number;
	mature: number;
	new: number;
	avgEaseFactor: number;
} {
	const cards = loadFlashcards();
	const now = Date.now();

	const due = cards.filter((c) => c.nextReview <= now).length;
	const learning = cards.filter(
		(c) => c.repetitions > 0 && c.interval < 21,
	).length;
	const mature = cards.filter((c) => c.interval >= 21).length;
	const newCards = cards.filter((c) => c.repetitions === 0).length;

	const avgEaseFactor =
		cards.length > 0
			? cards.reduce((sum, c) => sum + c.easeFactor, 0) / cards.length
			: 2.5;

	return {
		total: cards.length,
		due,
		learning,
		mature,
		new: newCards,
		avgEaseFactor: Math.round(avgEaseFactor * 100) / 100,
	};
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

export function convertQuizToFlashcards(
	questions: Array<{
		id: string;
		questionText: string;
		options: Array<{ text: string; isCorrect: boolean }>;
		explanation: string;
	}>,
	subject: string,
): FlashcardSM2[] {
	const cards = loadFlashcards();
	const newCards: FlashcardSM2[] = [];

	questions.forEach((q) => {
		const correctOption = q.options.find((o) => o.isCorrect);
		if (!correctOption) return;

		const newCard: FlashcardSM2 = {
			id: `fc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			front: q.questionText,
			back: correctOption.text,
			subject,
			topic: q.id,
			easeFactor: 2.5,
			interval: 0,
			repetitions: 0,
			nextReview: Date.now(),
			lastReview: null,
			createdAt: Date.now(),
		};

		newCards.push(newCard);
		cards.push(newCard);
	});

	saveFlashcards(cards);
	return newCards;
}
