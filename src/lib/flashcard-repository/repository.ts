import { offlineDB } from "@/lib/db/schema";
import { calculateNextReview } from "@/lib/utils/spaced-repetition";
import type {
	FlashcardRepository,
	FlashcardSM2,
	FlashcardStats,
} from "./types";

function generateId(): string {
	return `fc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function dueFilter(card: FlashcardSM2, now: number): boolean {
	return card.nextReview <= now;
}

function subjectFilter(card: FlashcardSM2, subject?: string): boolean {
	return !subject || card.subject === subject;
}

export class DexieFlashcardRepository implements FlashcardRepository {
	async getDueCards(subject?: string): Promise<FlashcardSM2[]> {
		const cards = await offlineDB.flashcards.toArray();
		const now = Date.now();
		return cards
			.filter((c) => dueFilter(c, now) && subjectFilter(c, subject))
			.sort((a, b) => a.nextReview - b.nextReview);
	}

	async getNewCards(subject?: string, limit = 20): Promise<FlashcardSM2[]> {
		const cards = await offlineDB.flashcards
			.filter((c) => c.repetitions === 0 && subjectFilter(c, subject))
			.toArray();
		return cards.slice(0, limit);
	}

	async getAll(subject?: string): Promise<FlashcardSM2[]> {
		const cards = await offlineDB.flashcards.toArray();
		return subject ? cards.filter((c) => c.subject === subject) : cards;
	}

	async getById(id: string): Promise<FlashcardSM2 | null> {
		return (await offlineDB.flashcards.get(id)) ?? null;
	}

	async create(
		front: string,
		back: string,
		subject: string,
		topic?: string,
	): Promise<FlashcardSM2> {
		const card: FlashcardSM2 = {
			id: generateId(),
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
		await offlineDB.flashcards.add(card);
		return card;
	}

	async update(id: string, updates: Partial<FlashcardSM2>): Promise<void> {
		await offlineDB.flashcards.update(id, updates);
	}

	async delete(id: string): Promise<void> {
		await offlineDB.flashcards.delete(id);
	}

	async review(id: string, quality: number): Promise<FlashcardSM2 | null> {
		const card = await offlineDB.flashcards.get(id);
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

		await offlineDB.flashcards.put(updatedCard);
		return updatedCard;
	}

	async getStats(): Promise<FlashcardStats> {
		const cards = await offlineDB.flashcards.toArray();
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

	async getGrouped(): Promise<Record<string, FlashcardSM2[]>> {
		const cards = await offlineDB.flashcards.toArray();
		const grouped: Record<string, FlashcardSM2[]> = {};
		for (const card of cards) {
			if (!grouped[card.subject]) {
				grouped[card.subject] = [];
			}
			grouped[card.subject].push(card);
		}
		return grouped;
	}
}

export const flashcardRepository: FlashcardRepository =
	new DexieFlashcardRepository();
