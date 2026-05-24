import { offlineDB } from "@/lib/db/schema";
import { calculateNextReviewFSRS, initFSRS } from "@/lib/orchestrator/fsrs";
import { calculateNextReview } from "@/lib/orchestrator/sm2";
import { loadFromStorage, saveToStorage } from "@/lib/utils/storage";
import type {
	CardStatus,
	FlashcardReview,
	FlashcardSM2,
	FlashcardStats,
	SRSettings,
} from "./types";
import { DEFAULT_SR_SETTINGS, SR_SETTINGS_KEY } from "./types";

// ---- Daily limits (from spaced-repetition/daily-limits.ts) ----

const DAILY_LIMIT_KEY = "lumni_sr_daily_budget";

interface DailyBudget {
	date: string;
	newCardsUsed: number;
	reviewsUsed: number;
}

function getTodayKey(): string {
	return new Date().toISOString().split("T")[0];
}

function loadBudget(): DailyBudget {
	if (typeof window === "undefined") {
		return { date: getTodayKey(), newCardsUsed: 0, reviewsUsed: 0 };
	}
	try {
		const stored = localStorage.getItem(DAILY_LIMIT_KEY);
		if (!stored)
			return { date: getTodayKey(), newCardsUsed: 0, reviewsUsed: 0 };
		const parsed = JSON.parse(stored) as DailyBudget;
		if (parsed.date !== getTodayKey()) {
			return { date: getTodayKey(), newCardsUsed: 0, reviewsUsed: 0 };
		}
		return parsed;
	} catch {
		return { date: getTodayKey(), newCardsUsed: 0, reviewsUsed: 0 };
	}
}

function saveBudget(budget: DailyBudget): void {
	if (typeof window === "undefined") return;
	try {
		localStorage.setItem(DAILY_LIMIT_KEY, JSON.stringify(budget));
	} catch {}
}

// ---- Learning steps (from spaced-repetition/learning-steps.ts) ----

const MINUTE_MS = 60_000;

function isInLearning(learningStep: number): boolean {
	return learningStep >= 0;
}

function isGraduated(learningStep: number): boolean {
	return learningStep === -1;
}

function advanceLearningStep(
	currentStep: number,
	steps: number[],
): { learningStep: number; delayMinutes: number } {
	const nextStep = currentStep + 1;
	if (nextStep >= steps.length) {
		return { learningStep: -1, delayMinutes: 0 };
	}
	return { learningStep: nextStep, delayMinutes: steps[nextStep] };
}

function resetLearningStep(): number {
	return 0;
}

function computeLearningReviewTime(delayMinutes: number): number {
	return Date.now() + delayMinutes * MINUTE_MS;
}

function getLearningStepDelay(stepIndex: number, steps: number[]): number {
	if (stepIndex < 0 || stepIndex >= steps.length) return 0;
	return steps[stepIndex];
}

// ---- Ease hell (from spaced-repetition/ease-hell.ts) ----

interface EaseHellConfig {
	consecutivePasses: number;
	boost: number;
}

function checkEaseHellRecovery(
	currentEaseFactor: number,
	consecutivePasses: number,
	config: EaseHellConfig,
): { shouldBoost: boolean; newEaseFactor: number } {
	const shouldBoost =
		consecutivePasses >= config.consecutivePasses && currentEaseFactor < 2.5;
	if (!shouldBoost) {
		return { shouldBoost: false, newEaseFactor: currentEaseFactor };
	}
	const newEaseFactor = Math.min(currentEaseFactor + config.boost, 2.5);
	return { shouldBoost: true, newEaseFactor };
}

// ---- Leech (from spaced-repetition/leech.ts) ----

interface LeechConfig {
	threshold: number;
	action: "suspend" | "bury" | "tag-only";
}

interface LeechResult {
	isLeech: boolean;
	newStatus: CardStatus | null;
	actionTaken: "suspend" | "bury" | "tag-only" | null;
}

function checkLeech(
	lapses: number,
	_currentStatus: CardStatus,
	alreadyLeeched: boolean,
	config: LeechConfig,
): LeechResult {
	if (alreadyLeeched) {
		return { isLeech: false, newStatus: null, actionTaken: null };
	}

	if (lapses < config.threshold) {
		return { isLeech: false, newStatus: null, actionTaken: null };
	}

	switch (config.action) {
		case "suspend":
			return { isLeech: true, newStatus: "suspended", actionTaken: "suspend" };
		case "bury":
			return { isLeech: true, newStatus: "buried", actionTaken: "bury" };
		case "tag-only":
			return { isLeech: true, newStatus: null, actionTaken: "tag-only" };
	}
}

// ---- Settings (from spaced-repetition/settings.ts) ----

function loadSRSettingsInternal(): SRSettings {
	return loadFromStorage(SR_SETTINGS_KEY, DEFAULT_SR_SETTINGS);
}

// ---- Repository implementation ----

function generateId(): string {
	return `fc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function subjectFilter(card: FlashcardSM2, subject?: string): boolean {
	return !subject || card.subject === subject;
}

function pickAlgorithm(): "sm2" | "fsrs" {
	return "fsrs";
}

async function countConsecutivePasses(cardId: string): Promise<number> {
	const history = await offlineDB.reviewHistory
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

// ---- The unified FlashcardEngine ----

export class FlashcardEngine {
	async getDueCards(subject?: string): Promise<FlashcardSM2[]> {
		const now = Date.now();
		const settings = loadSRSettingsInternal();
		const cards = await offlineDB.flashcards
			.where("nextReview")
			.belowOrEqual(now)
			.toArray();
		const active = cards
			.filter((c) => c.status === "active" && subjectFilter(c, subject))
			.sort((a, b) => a.nextReview - b.nextReview);
		const limit = this.getReviewLimit(settings.dailyReviewLimit, active.length);
		if (limit >= active.length) return active;
		return active.slice(0, limit);
	}

	async getNewCards(subject?: string, limit = 20): Promise<FlashcardSM2[]> {
		const settings = loadSRSettingsInternal();
		const cards = await offlineDB.flashcards
			.where("repetitions")
			.equals(0)
			.toArray();
		const active = cards.filter(
			(c) => c.status === "active" && subjectFilter(c, subject),
		);
		const newLimit = this.getNewCardLimit(
			settings.dailyNewLimit,
			Math.min(limit, active.length),
		);
		return active.slice(0, newLimit);
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
			learningStep: 0,
			leeched: false,
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
		const settings = loadSRSettingsInternal();
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
			const consecutivePasses = await countConsecutivePasses(card.id);
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
			const leechResult = checkLeech(
				updatedCard.lapses,
				updatedCard.status,
				updatedCard.leeched,
				{
					threshold: settings.leechThreshold,
					action: settings.leechAction,
				},
			);
			if (leechResult.isLeech) {
				updatedCard.leeched = true;
				if (leechResult.newStatus) {
					updatedCard.status = leechResult.newStatus;
				}
			}
		}

		updatedCard.lastReview = now;

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

	// ---- Daily limits ----

	getDailyRemaining(
		maxNew: number,
		maxReviews: number,
	): { newRemaining: number; reviewsRemaining: number } {
		const budget = loadBudget();
		return {
			newRemaining: Math.max(0, maxNew - budget.newCardsUsed),
			reviewsRemaining: Math.max(0, maxReviews - budget.reviewsUsed),
		};
	}

	consumeNewCard(maxNew: number): boolean {
		const budget = loadBudget();
		if (budget.newCardsUsed >= maxNew) return false;
		budget.newCardsUsed += 1;
		saveBudget(budget);
		return true;
	}

	consumeReview(maxReviews: number): boolean {
		const budget = loadBudget();
		if (budget.reviewsUsed >= maxReviews) return false;
		budget.reviewsUsed += 1;
		saveBudget(budget);
		return true;
	}

	getNewCardLimit(maxNew: number, count: number): number {
		const { newRemaining } = this.getDailyRemaining(maxNew, 0);
		if (count <= newRemaining) return count;
		const remaining = Math.max(0, newRemaining);
		if (remaining <= 0) return 0;
		return remaining;
	}

	getReviewLimit(maxReviews: number, count: number): number {
		const { reviewsRemaining } = this.getDailyRemaining(0, maxReviews);
		if (count <= reviewsRemaining) return count;
		const remaining = Math.max(0, reviewsRemaining);
		if (remaining <= 0) return 0;
		return remaining;
	}

	resetDailyBudget(): void {
		saveBudget({ date: getTodayKey(), newCardsUsed: 0, reviewsUsed: 0 });
	}

	// ---- Settings ----

	loadSettings(): SRSettings {
		return loadSRSettingsInternal();
	}

	saveSettings(settings: SRSettings): void {
		saveToStorage(SR_SETTINGS_KEY, settings);
	}

	resetSettings(): SRSettings {
		this.saveSettings(DEFAULT_SR_SETTINGS);
		return { ...DEFAULT_SR_SETTINGS };
	}

	// ---- Utility ----

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
