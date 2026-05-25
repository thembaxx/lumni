import { offlineDB } from "@/lib/db/schema";
import { calculateNextReviewFSRS, initFSRS } from "@/lib/orchestrator/fsrs";
import { enqueue } from "@/lib/orchestrator/job-queue";
import { calculateNextReview } from "@/lib/orchestrator/sm2";
import { loadFromStorage, saveToStorage } from "@/lib/utils/storage";
import { createDailyLimits } from "./daily-limits";
import { checkEaseHellRecovery } from "./ease-hell";
import {
	advanceLearningStep,
	computeLearningReviewTime,
	getLearningStepDelay,
	isGraduated,
	isInLearning,
	resetLearningStep,
} from "./learning-steps";
import { checkLeech } from "./leech-detection";
import type {
	FlashcardReview,
	FlashcardSM2,
	FlashcardStats,
	SRSettings,
} from "./types";
import { DEFAULT_SR_SETTINGS, SR_SETTINGS_KEY } from "./types";

const offlineDBTyped: typeof offlineDB = offlineDB;

export interface EngineDependencies {
	db: typeof offlineDB;
	enqueue: (type: string, payload: Record<string, unknown>) => Promise<unknown>;
	loadFromStorage: <T>(key: string, fallback: T) => T;
	saveToStorage: (key: string, value: unknown) => void;
	dailyLimits?: ReturnType<typeof createDailyLimits>;
}

const DEFAULT_DEPS: EngineDependencies = {
	db: offlineDBTyped,
	enqueue: enqueue as unknown as EngineDependencies["enqueue"],
	loadFromStorage,
	saveToStorage,
};

function generateId(): string {
	return `fc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function subjectFilter(card: FlashcardSM2, subject?: string): boolean {
	return !subject || card.subject === subject;
}

function pickAlgorithm(): "sm2" | "fsrs" {
	return "fsrs";
}

async function countConsecutivePasses(
	db: EngineDependencies["db"],
	cardId: string,
): Promise<number> {
	const history = await db.reviewHistory
		.where("cardId")
		.equals(cardId)
		.reverse()
		.sortBy("reviewedAt");
	const recent = history.reverse().slice(-10);
	let count = 0;
	for (let i = recent.length - 1; i >= 0; i--) {
		if (recent[i].quality >= 3) {
			count++;
		} else {
			break;
		}
	}
	return count;
}

export class FlashcardEngine {
	private db: EngineDependencies["db"];
	private enqueueFn: EngineDependencies["enqueue"];
	private loadFromStorageFn: EngineDependencies["loadFromStorage"];
	private saveToStorageFn: EngineDependencies["saveToStorage"];
	private dailyLimits: ReturnType<typeof createDailyLimits>;

	constructor(deps?: Partial<EngineDependencies>) {
		this.db = deps?.db ?? DEFAULT_DEPS.db;
		this.enqueueFn = deps?.enqueue ?? DEFAULT_DEPS.enqueue;
		this.loadFromStorageFn =
			deps?.loadFromStorage ?? DEFAULT_DEPS.loadFromStorage;
		this.saveToStorageFn = deps?.saveToStorage ?? DEFAULT_DEPS.saveToStorage;
		this.dailyLimits = deps?.dailyLimits ?? createDailyLimits();
	}

	private loadSRSettings(): SRSettings {
		return this.loadFromStorageFn(SR_SETTINGS_KEY, DEFAULT_SR_SETTINGS);
	}

	async getDueCards(subject?: string): Promise<FlashcardSM2[]> {
		const now = Date.now();
		const settings = this.loadSRSettings();
		const cards = await this.db.flashcards
			.where("nextReview")
			.belowOrEqual(now)
			.toArray();
		const active = cards
			.filter((c) => c.status === "active" && subjectFilter(c, subject))
			.sort((a, b) => a.nextReview - b.nextReview);
		const limit = this.dailyLimits.getReviewLimit(
			settings.dailyReviewLimit,
			active.length,
		);
		if (limit >= active.length) return active;
		return active.slice(0, limit);
	}

	async getNewCards(subject?: string, limit = 20): Promise<FlashcardSM2[]> {
		const settings = this.loadSRSettings();
		const cards = await this.db.flashcards
			.where("repetitions")
			.equals(0)
			.toArray();
		const active = cards.filter(
			(c) => c.status === "active" && subjectFilter(c, subject),
		);
		const newLimit = this.dailyLimits.getNewCardLimit(
			settings.dailyNewLimit,
			Math.min(limit, active.length),
		);
		return active.slice(0, newLimit);
	}

	async getAll(subject?: string): Promise<FlashcardSM2[]> {
		const cards = await this.db.flashcards.toArray();
		return subject ? cards.filter((c) => c.subject === subject) : cards;
	}

	async getById(id: string): Promise<FlashcardSM2 | null> {
		return (await this.db.flashcards.get(id)) ?? null;
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
			updatedAt: Date.now(),
			algorithm,
			stability: 0,
			difficulty: 5,
			status: "active",
			lapses: 0,
			learningStep: 0,
			leeched: false,
		};
		await this.db.flashcards.add(card);

		this.enqueueFn("appwrite-flashcard-sync", {
			id: card.id,
			front: card.front,
			back: card.back,
			subject: card.subject,
			topic: card.topic,
			easeFactor: card.easeFactor,
			interval: card.interval,
			repetitions: card.repetitions,
			nextReview: card.nextReview,
			lastReview: card.lastReview,
			createdAt: card.createdAt,
			updatedAt: card.updatedAt,
		}).catch((e: unknown) => console.warn("[FlashcardEngine] create sync:", e));

		return card;
	}

	async update(id: string, updates: Partial<FlashcardSM2>): Promise<void> {
		const merged = { ...updates, updatedAt: Date.now() };
		await this.db.flashcards.update(id, merged);
		this.enqueueFn("appwrite-flashcard-sync", {
			id,
			front: updates.front ?? "",
			back: updates.back ?? "",
			subject: updates.subject ?? "",
			topic: updates.topic,
			easeFactor: updates.easeFactor ?? 0,
			interval: updates.interval ?? 0,
			repetitions: updates.repetitions ?? 0,
			nextReview: updates.nextReview ?? 0,
			lastReview: updates.lastReview ?? null,
			createdAt: updates.createdAt ?? 0,
			updatedAt: Date.now(),
		}).catch((e: unknown) => console.warn("[FlashcardEngine] update sync:", e));
	}

	async delete(id: string): Promise<void> {
		await this.db.flashcards.delete(id);
		this.enqueueFn("appwrite-flashcard-delete", { id }).catch((e: unknown) =>
			console.warn("[FlashcardEngine] delete sync:", e),
		);
	}

	async review(id: string, quality: number): Promise<FlashcardSM2 | null> {
		const card = await this.db.flashcards.get(id);
		if (!card) return null;

		const now = Date.now();
		const settings = this.loadSRSettings();
		const passed = quality >= 3;
		const failed = quality < 3;

		let updatedCard: FlashcardSM2 = { ...card };

		const inLearning = isInLearning(card.learningStep);

		if (inLearning && passed) {
			const { learningStep, delayMinutes } = advanceLearningStep(
				card.learningStep,
				settings.learningSteps,
			);
			updatedCard.learningStep = learningStep;
			if (isGraduated(learningStep)) {
				updatedCard.interval = 1;
				updatedCard.repetitions = 1;
				updatedCard.nextReview = now + 86_400_000;
			} else {
				updatedCard.interval = 0;
				updatedCard.repetitions = 0;
				updatedCard.nextReview = computeLearningReviewTime(delayMinutes);
			}
			updatedCard.lapses = card.lapses;
		} else if (inLearning && failed) {
			updatedCard.learningStep = resetLearningStep();
			updatedCard.interval = 0;
			updatedCard.repetitions = 0;
			updatedCard.nextReview =
				now + getLearningStepDelay(0, settings.learningSteps) * 60_000;
			updatedCard.lapses = card.lapses + 1;
		} else if (card.algorithm === "fsrs") {
			const init = card.repetitions === 0 ? initFSRS(quality) : null;
			const stability = init?.stability ?? card.stability;
			const difficulty = init?.difficulty ?? card.difficulty;

			const result = calculateNextReviewFSRS(quality, stability, difficulty);

			updatedCard = {
				...updatedCard,
				easeFactor: result.difficulty > 7 ? 1.3 : 2.5,
				interval: result.interval,
				repetitions: failed ? 0 : card.repetitions + 1,
				nextReview: result.nextReview,
				stability: result.stability,
				difficulty: result.difficulty,
				lapses: failed ? card.lapses + 1 : card.lapses,
				learningStep: -1,
			};
		} else {
			const { easeFactor, interval, repetitions, nextReview } =
				calculateNextReview(
					quality,
					card.easeFactor,
					card.interval,
					card.repetitions,
				);

			updatedCard = {
				...updatedCard,
				easeFactor,
				interval,
				repetitions,
				nextReview,
				lapses: failed ? card.lapses + 1 : card.lapses,
				learningStep: -1,
			};
		}

		if (passed && updatedCard.easeFactor < 2.5 && !inLearning) {
			const consecutivePasses = await countConsecutivePasses(this.db, card.id);
			const { shouldBoost, newEaseFactor } = checkEaseHellRecovery(
				updatedCard.easeFactor,
				consecutivePasses,
				{
					consecutivePasses: settings.easeHellPasses,
					boost: settings.easeHellBoost,
				},
			);
			if (shouldBoost) {
				updatedCard.easeFactor = newEaseFactor;
			}
		}

		if (failed) {
			const leechResult = checkLeech(updatedCard.lapses, updatedCard.leeched, {
				threshold: settings.leechThreshold,
				action: settings.leechAction,
			});
			if (leechResult.isLeech) {
				updatedCard.leeched = true;
				if (leechResult.newStatus) {
					updatedCard.status = leechResult.newStatus;
				}
			}
		}

		updatedCard.lastReview = now;
		updatedCard.updatedAt = now;

		await this.db.flashcards.put(updatedCard);
		await this.saveReview(card.id, quality, updatedCard);

		this.enqueueFn("appwrite-flashcard-sync", {
			id: updatedCard.id,
			front: updatedCard.front,
			back: updatedCard.back,
			subject: updatedCard.subject,
			topic: updatedCard.topic,
			easeFactor: updatedCard.easeFactor,
			interval: updatedCard.interval,
			repetitions: updatedCard.repetitions,
			nextReview: updatedCard.nextReview,
			lastReview: updatedCard.lastReview,
			createdAt: updatedCard.createdAt,
			updatedAt: updatedCard.updatedAt,
		}).catch((e: unknown) => console.warn("[FlashcardEngine] review sync:", e));

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
		await this.db.reviewHistory.add(review);
	}

	async getReviewHistory(cardId: string): Promise<FlashcardReview[]> {
		return this.db.reviewHistory
			.where("cardId")
			.equals(cardId)
			.sortBy("reviewedAt");
	}

	async bury(id: string): Promise<void> {
		await this.db.flashcards.update(id, { status: "buried" });
	}

	async suspend(id: string): Promise<void> {
		await this.db.flashcards.update(id, { status: "suspended" });
	}

	async activate(id: string): Promise<void> {
		await this.db.flashcards.update(id, { status: "active" });
	}

	async getStats(): Promise<FlashcardStats> {
		const cards = await this.db.flashcards.toArray();
		const now = Date.now();

		const active = cards.filter((c) => c.status === "active");
		const due = active.filter((c) => c.nextReview <= now).length;
		const learning = active.filter(
			(c) =>
				isInLearning(c.learningStep) || (c.repetitions > 0 && c.interval < 21),
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
		const cards = await this.db.flashcards.toArray();
		const grouped: Record<string, FlashcardSM2[]> = {};
		for (const card of cards) {
			if (!grouped[card.subject]) {
				grouped[card.subject] = [];
			}
			grouped[card.subject].push(card);
		}
		return grouped;
	}

	getDailyRemaining(
		maxNew: number,
		maxReviews: number,
	): { newRemaining: number; reviewsRemaining: number } {
		return this.dailyLimits.getDailyRemaining(maxNew, maxReviews);
	}

	consumeNewCard(maxNew: number): boolean {
		return this.dailyLimits.consumeNewCard(maxNew);
	}

	consumeReview(maxReviews: number): boolean {
		return this.dailyLimits.consumeReview(maxReviews);
	}

	getNewCardLimit(maxNew: number, count: number): number {
		return this.dailyLimits.getNewCardLimit(maxNew, count);
	}

	getReviewLimit(maxReviews: number, count: number): number {
		return this.dailyLimits.getReviewLimit(maxReviews, count);
	}

	resetDailyBudget(): void {
		this.dailyLimits.resetDailyBudget();
	}

	loadSettings(): SRSettings {
		return this.loadSRSettings();
	}

	saveSettings(settings: SRSettings): void {
		this.saveToStorageFn(SR_SETTINGS_KEY, settings);
	}

	resetSettings(): SRSettings {
		this.saveSettings(DEFAULT_SR_SETTINGS);
		return { ...DEFAULT_SR_SETTINGS };
	}

	getMasteryLevel(
		interval: number,
	): "new" | "learning" | "reviewing" | "mastered" {
		if (interval === 0) return "new";
		if (interval < 7) return "learning";
		if (interval < 21) return "reviewing";
		return "mastered";
	}

	getIntervalLabel(interval: number): string {
		if (interval === 0) return "New";
		if (interval === 1) return "1 day";
		if (interval < 7) return `${interval} days`;
		if (interval < 30) return `${Math.round(interval / 7)} weeks`;
		if (interval < 365) return `${Math.round(interval / 30)} months`;
		return `${Math.round(interval / 365)} years`;
	}

	async convertQuizToFlashcards(
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
				return [this.create(q.questionText, correctOption.text, subject, q.id)];
			}),
		);
		return newCards;
	}
}

export const flashcardEngine = new FlashcardEngine();
