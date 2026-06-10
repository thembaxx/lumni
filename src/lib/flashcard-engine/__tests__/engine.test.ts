import { beforeEach, describe, expect, test } from "vitest";
import { FlashcardEngine } from "../engine";
import type { FlashcardReview, FlashcardSM2 } from "../types";
import { DEFAULT_SR_SETTINGS } from "../types";

function createMockDb() {
	const cards = new Map<string, FlashcardSM2>();
	const reviews: FlashcardReview[] = [];

	return {
		flashcards: {
			add: async (card: FlashcardSM2) => {
				cards.set(card.id, card);
			},
			get: async (id: string) => cards.get(id),
			update: async (id: string, updates: Partial<FlashcardSM2>) => {
				const existing = cards.get(id);
				if (existing) {
					cards.set(id, { ...existing, ...updates });
				}
			},
			delete: async (id: string) => {
				cards.delete(id);
			},
			put: async (card: FlashcardSM2) => {
				cards.set(card.id, card);
			},
			toArray: async () => Array.from(cards.values()),
			where: (field: string) => ({
				belowOrEqual: (_val: number) => ({
					toArray: async () => {
						const all = Array.from(cards.values());
						if (field === "nextReview") {
							return all.filter((c) => c.nextReview <= _val);
						}
						return all;
					},
				}),
				equals: (_val: string | number) => ({
					toArray: async () => {
						const all = Array.from(cards.values());
						if (field === "repetitions") {
							return all.filter((c) => c.repetitions === _val);
						}
						return all;
					},
				}),
			}),
		},
		reviewHistory: {
			add: async (review: FlashcardReview) => {
				reviews.push(review);
			},
			where: (_field: string) => ({
				equals: (_val: string) => ({
					reverse: () => ({
						sortBy: async (_sortField: string) => {
							return reviews
								.filter((r) => r.cardId === _val)
								.sort((a, b) => a.reviewedAt - b.reviewedAt);
						},
					}),
					sortBy: async (_sortField: string) => {
						return reviews
							.filter((r) => r.cardId === _val)
							.sort((a, b) => a.reviewedAt - b.reviewedAt);
					},
				}),
			}),
		},
	};
}

function createMockDeps() {
	const db = createMockDb();
	const noopEnqueue = async () => {};
	const storage = new Map<string, unknown>();
	const loadFromStorage = <T>(_key: string, fallback: T): T => {
		return (storage.get(_key) as T) ?? fallback;
	};
	const saveToStorage = (key: string, value: unknown) => {
		storage.set(key, value);
	};

	const unlimitedDailyLimits = {
		getDailyRemaining: (_maxNew: number, _maxReviews: number) => ({
			newRemaining: _maxNew,
			reviewsRemaining: _maxReviews,
		}),
		consumeNewCard: () => true,
		consumeReview: () => true,
		getNewCardLimit: (_maxNew: number, count: number) => count,
		getReviewLimit: (_maxReviews: number, count: number) => count,
		resetDailyBudget: () => {},
	};

	return {
		db,
		noopEnqueue,
		loadFromStorage,
		saveToStorage,
		unlimitedDailyLimits,
		storage,
	};
}

describe("FlashcardEngine", () => {
	let deps: ReturnType<typeof createMockDeps>;
	let engine: FlashcardEngine;

	beforeEach(() => {
		deps = createMockDeps();
		engine = new FlashcardEngine({
			db: deps.db as unknown as Parameters<typeof FlashcardEngine>[0]["db"],
			enqueue: deps.noopEnqueue as unknown as Parameters<
				typeof FlashcardEngine
			>[0]["enqueue"],
			loadFromStorage: deps.loadFromStorage,
			saveToStorage: deps.saveToStorage,
			dailyLimits: deps.unlimitedDailyLimits,
		});
	});

	describe("create", () => {
		test("creates a flashcard with correct fields", async () => {
			const card = await engine.create(
				"Question?",
				"Answer.",
				"mathematics",
				"algebra",
			);
			expect(card.front).toBe("Question?");
			expect(card.back).toBe("Answer.");
			expect(card.subject).toBe("mathematics");
			expect(card.topic).toBe("algebra");
			expect(card.easeFactor).toBe(2.5);
			expect(card.interval).toBe(0);
			expect(card.repetitions).toBe(0);
			expect(card.status).toBe("active");
			expect(card.lapses).toBe(0);
			expect(card.learningStep).toBe(0);
			expect(card.leeched).toBe(false);
			expect(card.id).toBeTruthy();
		});

		test("creates a card without a topic", async () => {
			const card = await engine.create("Front", "Back", "physics");
			expect(card.topic).toBeUndefined();
		});
	});

	describe("getById", () => {
		test("returns null for non-existent card", async () => {
			const card = await engine.getById("nonexistent");
			expect(card).toBeNull();
		});

		test("returns the card after creation", async () => {
			const created = await engine.create("Q", "A", "math");
			const fetched = await engine.getById(created.id);
			expect(fetched).not.toBeNull();
			expect(fetched?.id).toBe(created.id);
		});
	});

	describe("update", () => {
		test("updates card fields", async () => {
			const card = await engine.create("Q", "A", "math");
			await engine.update(card.id, { front: "Updated Q" });
			const updated = await engine.getById(card.id);
			expect(updated?.front).toBe("Updated Q");
		});
	});

	describe("delete", () => {
		test("removes the card from the database", async () => {
			const card = await engine.create("Q", "A", "math");
			await engine.delete(card.id);
			const fetched = await engine.getById(card.id);
			expect(fetched).toBeNull();
		});
	});

	describe("getAll", () => {
		test("returns all cards", async () => {
			await engine.create("Q1", "A1", "math");
			await engine.create("Q2", "A2", "physics");
			const all = await engine.getAll();
			expect(all.length).toBe(2);
		});

		test("filters by subject", async () => {
			await engine.create("Q1", "A1", "math");
			await engine.create("Q2", "A2", "physics");
			const mathCards = await engine.getAll("math");
			expect(mathCards.length).toBe(1);
			expect(mathCards[0].front).toBe("Q1");
		});
	});

	describe("getDueCards", () => {
		test("returns cards whose nextReview is in the past", async () => {
			const past = Date.now() - 86_400_000;
			await engine.create("Q1", "A1", "math");
			const all = await engine.getAll();
			await engine.update(all[0].id, { nextReview: past });
			const due = await engine.getDueCards();
			expect(due.length).toBe(1);
		});

		test("does not return cards with future nextReview", async () => {
			const future = Date.now() + 86_400_000;
			await engine.create("Q1", "A1", "math");
			const all = await engine.getAll();
			await engine.update(all[0].id, { nextReview: future });
			const due = await engine.getDueCards();
			expect(due.length).toBe(0);
		});
	});

	describe("getNewCards", () => {
		test("returns cards with 0 repetitions", async () => {
			await engine.create("Q1", "A1", "math");
			await engine.create("Q2", "A2", "physics");
			const newCards = await engine.getNewCards();
			expect(newCards.length).toBe(2);
		});

		test("does not return cards that have been reviewed", async () => {
			await engine.create("Q1", "A1", "math");
			const all = await engine.getAll();
			await engine.update(all[0].id, { repetitions: 1 });
			const newCards = await engine.getNewCards();
			expect(newCards.length).toBe(0);
		});
	});

	describe("bury / suspend / activate", () => {
		test("bury sets status to buried", async () => {
			const card = await engine.create("Q", "A", "math");
			await engine.bury(card.id);
			const updated = await engine.getById(card.id);
			expect(updated?.status).toBe("buried");
		});

		test("suspend sets status to suspended", async () => {
			const card = await engine.create("Q", "A", "math");
			await engine.suspend(card.id);
			const updated = await engine.getById(card.id);
			expect(updated?.status).toBe("suspended");
		});

		test("activate sets status back to active", async () => {
			const card = await engine.create("Q", "A", "math");
			await engine.suspend(card.id);
			await engine.activate(card.id);
			const updated = await engine.getById(card.id);
			expect(updated?.status).toBe("active");
		});
	});

	describe("getStats", () => {
		test("returns correct stats for empty deck", async () => {
			const stats = await engine.getStats();
			expect(stats.total).toBe(0);
			expect(stats.due).toBe(0);
			expect(stats.learning).toBe(0);
			expect(stats.mature).toBe(0);
			expect(stats.new).toBe(0);
			expect(stats.avgEaseFactor).toBe(2.5);
		});

		test("returns correct stats with cards", async () => {
			const card = await engine.create("Q1", "A1", "math");
			const past = Date.now() - 86_400_000;
			await engine.update(card.id, {
				nextReview: past,
				interval: 30,
				repetitions: 3,
				easeFactor: 2.0,
			});
			const stats = await engine.getStats();
			expect(stats.total).toBe(1);
			expect(stats.due).toBe(1);
			expect(stats.mature).toBe(1);
			expect(stats.new).toBe(0);
			expect(stats.avgEaseFactor).toBe(2.0);
		});
	});

	describe("getGrouped", () => {
		test("groups cards by subject", async () => {
			await engine.create("Q1", "A1", "math");
			await engine.create("Q2", "A2", "physics");
			await engine.create("Q3", "A3", "math");
			const grouped = await engine.getGrouped();
			expect(Object.keys(grouped).length).toBe(2);
			expect(grouped.math.length).toBe(2);
			expect(grouped.physics.length).toBe(1);
		});
	});

	describe("getMasteryLevel", () => {
		test("interval 0 returns new", () => {
			expect(engine.getMasteryLevel(0)).toBe("new");
		});

		test("interval 1-6 returns learning", () => {
			expect(engine.getMasteryLevel(1)).toBe("learning");
			expect(engine.getMasteryLevel(6)).toBe("learning");
		});

		test("interval 7-20 returns reviewing", () => {
			expect(engine.getMasteryLevel(7)).toBe("reviewing");
			expect(engine.getMasteryLevel(20)).toBe("reviewing");
		});

		test("interval >= 21 returns mastered", () => {
			expect(engine.getMasteryLevel(21)).toBe("mastered");
			expect(engine.getMasteryLevel(365)).toBe("mastered");
		});
	});

	describe("getIntervalLabel", () => {
		test('interval 0 returns "New"', () => {
			expect(engine.getIntervalLabel(0)).toBe("New");
		});

		test('interval 1 returns "1 day"', () => {
			expect(engine.getIntervalLabel(1)).toBe("1 day");
		});

		test('interval 2-6 returns "{n} days"', () => {
			expect(engine.getIntervalLabel(3)).toBe("3 days");
		});

		test('interval 7-29 returns "{n} weeks"', () => {
			expect(engine.getIntervalLabel(14)).toBe("2 weeks");
		});

		test('interval 30-364 returns "{n} months"', () => {
			expect(engine.getIntervalLabel(60)).toBe("2 months");
		});

		test('interval >= 365 returns "{n} years"', () => {
			expect(engine.getIntervalLabel(730)).toBe("2 years");
		});
	});

	describe("review", () => {
		test("returns null for non-existent card", async () => {
			const result = await engine.review("nonexistent", 3);
			expect(result).toBeNull();
		});

		test("records a review in reviewHistory", async () => {
			const card = await engine.create("Q", "A", "math");
			await engine.update(card.id, { learningStep: -1 });
			await engine.review(card.id, 4);
			const history = await engine.getReviewHistory(card.id);
			expect(history.length).toBe(1);
			expect(history[0].cardId).toBe(card.id);
			expect(history[0].quality).toBe(4);
		});

		test("increments repetitions on quality >= 3", async () => {
			const card = await engine.create("Q", "A", "math");
			await engine.update(card.id, { learningStep: -1 });
			const updated = await engine.review(card.id, 4);
			expect(updated).not.toBeNull();
			expect(updated?.repetitions).toBeGreaterThan(0);
		});

		test("failed review (quality < 3) resets repetitions", async () => {
			const card = await engine.create("Q", "A", "math");
			await engine.update(card.id, { learningStep: -1, repetitions: 5 });
			const updated = await engine.review(card.id, 0);
			expect(updated).not.toBeNull();
			expect(updated?.repetitions).toBe(0);
		});
	});

	describe("saveSettings / loadSettings / resetSettings", () => {
		test("loadSettings returns defaults initially", () => {
			const settings = engine.loadSettings();
			expect(settings.dailyNewLimit).toBe(DEFAULT_SR_SETTINGS.dailyNewLimit);
			expect(settings.learningSteps).toEqual(DEFAULT_SR_SETTINGS.learningSteps);
		});

		test("saveSettings persists custom settings", () => {
			engine.saveSettings({ ...DEFAULT_SR_SETTINGS, dailyNewLimit: 50 });
			const settings = engine.loadSettings();
			expect(settings.dailyNewLimit).toBe(50);
		});

		test("resetSettings restores defaults", () => {
			engine.saveSettings({ ...DEFAULT_SR_SETTINGS, dailyNewLimit: 999 });
			engine.resetSettings();
			const settings = engine.loadSettings();
			expect(settings.dailyNewLimit).toBe(DEFAULT_SR_SETTINGS.dailyNewLimit);
		});
	});

	describe("convertQuizToFlashcards", () => {
		test("creates cards from quiz questions with correct answers", async () => {
			const questions = [
				{
					id: "q1",
					questionText: "What is 2+2?",
					options: [
						{ text: "3", isCorrect: false },
						{ text: "4", isCorrect: true },
					],
					explanation: "Addition",
				},
				{
					id: "q2",
					questionText: "What is H2O?",
					options: [
						{ text: "Water", isCorrect: true },
						{ text: "Salt", isCorrect: false },
					],
					explanation: "Chemistry",
				},
			];
			const cards = await engine.convertQuizToFlashcards(questions, "science");
			expect(cards.length).toBe(2);
			expect(cards[0].front).toBe("What is 2+2?");
			expect(cards[0].back).toBe("4");
			expect(cards[1].front).toBe("What is H2O?");
			expect(cards[1].back).toBe("Water");
		});

		test("skips questions with no correct option", async () => {
			const questions = [
				{
					id: "q1",
					questionText: "No answer?",
					options: [
						{ text: "A", isCorrect: false },
						{ text: "B", isCorrect: false },
					],
					explanation: "none",
				},
			];
			const cards = await engine.convertQuizToFlashcards(questions, "math");
			expect(cards.length).toBe(0);
		});
	});

	describe("getDailyRemaining", () => {
		test("returns correct remaining values", () => {
			const remaining = engine.getDailyRemaining(20, 200);
			expect(remaining.newRemaining).toBe(20);
			expect(remaining.reviewsRemaining).toBe(200);
		});
	});
});
