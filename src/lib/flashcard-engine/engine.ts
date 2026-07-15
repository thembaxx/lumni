import { logError } from "@/lib/shared/logger";
import { enqueueOutbox } from "@/lib/sync/outbox";
import {
  calculateNextReview,
  calculateNextReviewFSRS,
  checkEaseHellRecovery,
  checkLeech,
  initFSRS,
} from "./algorithms";
import { createCard, updateCard, deleteCard, convertQuizToFlashcards } from "./card-ops";
import { createDailyLimits } from "./daily-limits";
import type { EngineDependencies } from "./engine-deps";
import { DEFAULT_DEPS } from "./engine-deps";
import { subjectFilter, countConsecutivePasses, syncCardPayload } from "./engine-helpers";
import {
  advanceLearningStep,
  computeLearningReviewTime,
  getLearningStepDelay,
  isGraduated,
  isInLearning,
  resetLearningStep,
} from "./learning-steps";
import type { FlashcardReview, FlashcardSM2, FlashcardStats, SRSettings } from "./types";
import { DEFAULT_SR_SETTINGS, SR_SETTINGS_KEY } from "./types";

export type { EngineDependencies } from "./engine-deps";

export class FlashcardEngine {
  private db: EngineDependencies["db"];
  private enqueueFn: EngineDependencies["enqueue"];
  private loadFromStorageFn: EngineDependencies["loadFromStorage"];
  private saveToStorageFn: EngineDependencies["saveToStorage"];
  private dailyLimits: ReturnType<typeof createDailyLimits>;

  constructor(deps?: Partial<EngineDependencies>) {
    this.db = deps?.db ?? DEFAULT_DEPS.db;
    this.enqueueFn = deps?.enqueue ?? DEFAULT_DEPS.enqueue;
    this.loadFromStorageFn = deps?.loadFromStorage ?? DEFAULT_DEPS.loadFromStorage;
    this.saveToStorageFn = deps?.saveToStorage ?? DEFAULT_DEPS.saveToStorage;
    this.dailyLimits = deps?.dailyLimits ?? createDailyLimits();
  }

  private loadSRSettings(): SRSettings {
    return this.loadFromStorageFn(SR_SETTINGS_KEY, DEFAULT_SR_SETTINGS);
  }

  async getDueCards(subject?: string): Promise<FlashcardSM2[]> {
    const now = Date.now();
    const settings = this.loadSRSettings();
    const cards = await this.db.flashcards.where("nextReview").belowOrEqual(now).toArray();
    const active = cards
      .filter((c) => c.status === "active" && subjectFilter(c, subject))
      .toSorted((a, b) => a.nextReview - b.nextReview);
    const limit = this.dailyLimits.getReviewLimit(settings.dailyReviewLimit, active.length);
    if (limit >= active.length) return active;
    return active.slice(0, limit);
  }

  async getNewCards(subject?: string, limit = 20): Promise<FlashcardSM2[]> {
    const settings = this.loadSRSettings();
    const cards = await this.db.flashcards.where("repetitions").equals(0).toArray();
    const active = cards.filter((c) => c.status === "active" && subjectFilter(c, subject));
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
    return createCard(this.db, this.enqueueFn, front, back, subject, topic);
  }

  async update(id: string, updates: Partial<FlashcardSM2>): Promise<void> {
    return updateCard(this.db, this.enqueueFn, id, updates);
  }

  async delete(id: string): Promise<void> {
    return deleteCard(this.db, this.enqueueFn, id);
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
      updatedCard.nextReview = now + getLearningStepDelay(0, settings.learningSteps) * 60_000;
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
      const { easeFactor, interval, repetitions, nextReview } = calculateNextReview(
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

    try {
      await this.db.flashcards.put(updatedCard);
      await this.saveReview(card.id, quality, updatedCard);
    } catch (error) {
      logError("FlashcardEngine.review", error, { cardId: card.id, quality });
      throw error;
    }

    this.enqueueFn("appwrite-flashcard-sync", syncCardPayload(updatedCard)).catch((e: unknown) =>
      logError("FlashcardEngine.ReviewSync", e),
    );
    enqueueOutbox("flashcards", updatedCard.id, "update", updatedCard).catch((e: unknown) =>
      logError("FlashcardEngine.ReviewOutbox", e),
    );

    return updatedCard;
  }

  private async saveReview(cardId: string, quality: number, card: FlashcardSM2): Promise<void> {
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
    return this.db.reviewHistory.where("cardId").equals(cardId).sortBy("reviewedAt");
  }

  async bury(id: string): Promise<void> {
    await this.db.flashcards.update(id, { status: "buried" });
    const card = await this.db.flashcards.get(id);
    if (card) {
      enqueueOutbox("flashcards", id, "update", card).catch((e: unknown) =>
        logError("FlashcardEngine.BuryOutbox", e),
      );
    }
  }

  async suspend(id: string): Promise<void> {
    await this.db.flashcards.update(id, { status: "suspended" });
    const card = await this.db.flashcards.get(id);
    if (card) {
      enqueueOutbox("flashcards", id, "update", card).catch((e: unknown) =>
        logError("FlashcardEngine.SuspendOutbox", e),
      );
    }
  }

  async activate(id: string): Promise<void> {
    await this.db.flashcards.update(id, { status: "active" });
    const card = await this.db.flashcards.get(id);
    if (card) {
      enqueueOutbox("flashcards", id, "update", card).catch((e: unknown) =>
        logError("FlashcardEngine.ActivateOutbox", e),
      );
    }
  }

  async getStats(): Promise<FlashcardStats> {
    const cards = await this.db.flashcards.toArray();
    const now = Date.now();

    const active = cards.filter((c) => c.status === "active");
    const due = active.filter((c) => c.nextReview <= now).length;
    const learning = active.filter(
      (c) => isInLearning(c.learningStep) || (c.repetitions > 0 && c.interval < 21),
    ).length;
    const mature = active.filter((c) => c.interval >= 21).length;
    const newCards = active.filter((c) => c.repetitions === 0).length;

    const avgEaseFactor =
      active.length > 0 ? active.reduce((sum, c) => sum + c.easeFactor, 0) / active.length : 2.5;

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

  getMasteryLevel(interval: number): "new" | "learning" | "reviewing" | "mastered" {
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
    return convertQuizToFlashcards(this.db, this.enqueueFn, questions, subject);
  }
}

export const flashcardEngine = new FlashcardEngine();
