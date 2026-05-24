import { offlineDB } from "@/lib/db/schema";
import { calculateNextReviewFSRS, initFSRS } from "@/lib/orchestrator/fsrs";
import { calculateNextReview } from "@/lib/orchestrator/sm2";
import type {
	FlashcardRepository,
	FlashcardReview,
	FlashcardSM2,
	FlashcardStats,
} from "./types";

function generateId(): string {
	return `fc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function subjectFilter(card: FlashcardSM2, subject?: string): boolean {
	return !subject || card.subject === subject;
}

function pickAlgorithm(): "sm2" | "fsrs" {
	return "fsrs";
}

export class DexieFlashcardRepository implements FlashcardRepository {
	async getDueCards(subject?: string): Promise<FlashcardSM2[]> {
		const now = Date.now();
		const cards = await offlineDB.flashcards
			.where("nextReview")
			.belowOrEqual(now)
			.toArray();
		return cards
			.filter((c) => c.status === "active" && subjectFilter(c, subject))
			.sort((a, b) => a.nextReview - b.nextReview);
	}

	async getNewCards(subject?: string, limit = 20): Promise<FlashcardSM2[]> {
		const cards = await offlineDB.flashcards
			.where("repetitions")
			.equals(0)
			.toArray();
		return cards
			.filter((c) => c.status === "active" && subjectFilter(c, subject))
			.slice(0, limit);
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
		const algorithm = pickAlgorithm();
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
			algorithm,
			stability: 0,
			difficulty: 5,
			status: "active",
			lapses: 0,
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

		const now = Date.now();

		if (card.algorithm === "fsrs") {
			const init = card.repetitions === 0 ? initFSRS(quality) : null;
			const stability = init?.stability ?? card.stability;
			const difficulty = init?.difficulty ?? card.difficulty;

			const result = calculateNextReviewFSRS(quality, stability, difficulty);

			const updatedCard: FlashcardSM2 = {
				...card,
				easeFactor: result.difficulty > 7 ? 1.3 : 2.5,
				interval: result.interval,
				repetitions: quality < 3 ? 0 : card.repetitions + 1,
				nextReview: result.nextReview,
				lastReview: now,
				stability: result.stability,
				difficulty: result.difficulty,
				lapses: quality < 3 ? card.lapses + 1 : card.lapses,
			};

			await offlineDB.flashcards.put(updatedCard);
			await this.saveReview(card.id, quality, updatedCard);
			return updatedCard;
		}

		const { easeFactor, interval, repetitions, nextReview } =
			calculateNextReview(
				quality,
				card.easeFactor,
				card.interval,
				card.repetitions,
			);

		const updatedCard: FlashcardSM2 = {
			...card,
			easeFactor,
			interval,
			repetitions,
			nextReview,
			lastReview: now,
			lapses: quality < 3 ? card.lapses + 1 : card.lapses,
		};

		await offlineDB.flashcards.put(updatedCard);
		await this.saveReview(card.id, quality, updatedCard);
		return updatedCard;
	}

	private async saveReview(
		cardId: string,
		quality: number,
		card: FlashcardSM2,
	): Promise<void> {
		const review: FlashcardReview = {
			cardId,
			quality,
			algorithm: card.algorithm,
			easeFactor: card.easeFactor,
			stability: card.stability,
			difficulty: card.difficulty,
			interval: card.interval,
			reviewedAt: Date.now(),
		};
		await offlineDB.reviewHistory.add(review);
	}

	async getReviewHistory(cardId: string): Promise<FlashcardReview[]> {
		return offlineDB.reviewHistory
			.where("cardId")
			.equals(cardId)
			.sortBy("reviewedAt");
	}

	async bury(id: string): Promise<void> {
		await offlineDB.flashcards.update(id, { status: "buried" });
	}

	async suspend(id: string): Promise<void> {
		await offlineDB.flashcards.update(id, { status: "suspended" });
	}

	async activate(id: string): Promise<void> {
		await offlineDB.flashcards.update(id, { status: "active" });
	}

	async getStats(): Promise<FlashcardStats> {
		const cards = await offlineDB.flashcards.toArray();
		const now = Date.now();

		const active = cards.filter((c) => c.status === "active");
		const due = active.filter((c) => c.nextReview <= now).length;
		const learning = active.filter(
			(c) => c.repetitions > 0 && c.interval < 21,
		).length;
		const mature = active.filter((c) => c.interval >= 21).length;
		const newCards = active.filter((c) => c.repetitions === 0).length;

		const avgEaseFactor =
			active.length > 0
				? active.reduce((sum, c) => sum + c.easeFactor, 0) / active.length
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
