import { describe, expect, mock, test } from "bun:test";
import type { FlashcardSM2 } from "../types";

function makeCard(overrides: Partial<FlashcardSM2> = {}): FlashcardSM2 {
	return {
		id: "fc_test_1",
		front: "What is 2+2?",
		back: "4",
		subject: "mathematics",
		topic: "algebra",
		easeFactor: 2.5,
		interval: 0,
		repetitions: 0,
		nextReview: Date.now(),
		lastReview: null,
		createdAt: Date.now(),
		algorithm: "fsrs",
		stability: 0,
		difficulty: 5,
		status: "active",
		lapses: 0,
		learningStep: -1,
		leeched: false,
		...overrides,
	};
}

const mockCards: FlashcardSM2[] = [
	makeCard({ id: "fc_1", nextReview: Date.now() - 10000 }),
	makeCard({
		id: "fc_2",
		subject: "physical-sciences",
		nextReview: Date.now() - 5000,
	}),
	makeCard({ id: "fc_3", nextReview: Date.now() + 999999 }),
	makeCard({
		id: "fc_4",
		repetitions: 3,
		interval: 30,
		nextReview: Date.now() - 1000,
	}),
	makeCard({
		id: "fc_5",
		repetitions: 1,
		interval: 3,
		nextReview: Date.now() - 1000,
	}),
];

const storedCards = [...mockCards];

const mockReviewStore: Record<string, unknown>[] = [];

function whereOnTable(_tableName: string, store: Record<string, unknown>[]) {
	let whereField: string | null = null;
	let _whereValue: unknown = null;
	return {
		where: (field: string) => {
			whereField = field;
			_whereValue = null;
			return {
				equals: (val: unknown) => {
					_whereValue = val;
					return {
						toArray: async () =>
							store.filter(
								(s) =>
									whereField !== null &&
									(s as Record<string, unknown>)[whereField] === val,
							),
						first: async () =>
							store.find(
								(s) =>
									whereField !== null &&
									(s as Record<string, unknown>)[whereField] === val,
							) ?? null,
						sortBy: async (_field: string) =>
							store.filter(
								(s) =>
									whereField !== null &&
									(s as Record<string, unknown>)[whereField] === val,
							),
						reverse: () => ({
							sortBy: async (_field: string) =>
								store.filter(
									(s) =>
										whereField !== null &&
										(s as Record<string, unknown>)[whereField] === val,
								),
						}),
					};
				},
				belowOrEqual: (val: number) => ({
					toArray: async () =>
						store.filter(
							(s) =>
								whereField !== null &&
								(s as Record<string, unknown>)[whereField] <= val,
						),
				}),
			};
		},
		get: async (id: string) =>
			store.find((s) => (s as Record<string, unknown>).id === id) ?? null,
		toArray: async () => [...store],
		add: async (item: unknown) => {
			store.push(item as Record<string, unknown>);
			return (item as Record<string, unknown>).id ?? store.length;
		},
		update: async (id: string, updates: Record<string, unknown>) => {
			const idx = store.findIndex(
				(s) => (s as Record<string, unknown>).id === id,
			);
			if (idx >= 0) {
				store[idx] = { ...store[idx], ...updates };
			}
			return 1;
		},
		delete: async (id: string) => {
			const idx = store.findIndex(
				(s) => (s as Record<string, unknown>).id === id,
			);
			if (idx >= 0) store.splice(idx, 1);
		},
		put: async (card: Record<string, unknown>) => {
			const idx = store.findIndex(
				(s) => (s as Record<string, unknown>).id === card.id,
			);
			if (idx >= 0) {
				store[idx] = card;
			} else {
				store.push(card);
			}
			return card.id;
		},
	};
}

const mockFlashcardsTable = whereOnTable("flashcards", storedCards);
const mockReviewHistoryTable = whereOnTable("reviewHistory", mockReviewStore);

mock.module("@/lib/db/schema", () => ({
	offlineDB: {
		flashcards: mockFlashcardsTable,
		reviewHistory: mockReviewHistoryTable,
	},
}));

const { DexieFlashcardRepository } = await import("../repository");

describe("DexieFlashcardRepository", () => {
	const repo = new DexieFlashcardRepository();

	test("getAll returns all cards", async () => {
		const cards = await repo.getAll();
		expect(cards).toHaveLength(storedCards.length);
	});

	test("getAll filters by subject", async () => {
		const cards = await repo.getAll("mathematics");
		expect(cards.every((c) => c.subject === "mathematics")).toBe(true);
	});

	test("getById returns card by id", async () => {
		const card = await repo.getById("fc_1");
		expect(card).not.toBeNull();
		expect(card?.id).toBe("fc_1");
	});

	test("getById returns null for missing card", async () => {
		const card = await repo.getById("nonexistent");
		expect(card).toBeNull();
	});

	test("getDueCards returns cards with nextReview <= now", async () => {
		const due = await repo.getDueCards();
		const now = Date.now();
		expect(due.every((c) => c.nextReview <= now)).toBe(true);
		expect(due.length).toBeGreaterThan(0);
	});

	test("getDueCards filters by subject", async () => {
		const due = await repo.getDueCards("mathematics");
		expect(due.every((c) => c.subject === "mathematics")).toBe(true);
	});

	test("getNewCards returns cards with repetitions === 0", async () => {
		const newCards = await repo.getNewCards();
		expect(newCards.every((c) => c.repetitions === 0)).toBe(true);
	});

	test("getNewCards respects limit", async () => {
		const limited = await repo.getNewCards(undefined, 1);
		expect(limited.length).toBeLessThanOrEqual(1);
	});

	test("create adds a new card with default SM-2 values", async () => {
		const card = await repo.create(
			"test front",
			"test back",
			"mathematics",
			"algebra",
		);
		expect(card.front).toBe("test front");
		expect(card.back).toBe("test back");
		expect(card.easeFactor).toBe(2.5);
		expect(card.interval).toBe(0);
		expect(card.repetitions).toBe(0);
		expect(card.id).toStartWith("fc_");
	});

	test("update modifies card fields", async () => {
		await repo.update("fc_1", { easeFactor: 3.0, interval: 10 });
		const card = await repo.getById("fc_1");
		expect(card?.easeFactor).toBe(3.0);
		expect(card?.interval).toBe(10);
	});

	test("delete removes card", async () => {
		const before = await repo.getAll();
		const countBefore = before.length;
		await repo.delete("fc_1");
		const after = await repo.getAll();
		expect(after).toHaveLength(countBefore - 1);
		const deleted = await repo.getById("fc_1");
		expect(deleted).toBeNull();
		storedCards.push(makeCard({ id: "fc_1" }));
	});

	test("review returns null for unknown card", async () => {
		const result = await repo.review("nonexistent", 4);
		expect(result).toBeNull();
	});

	test("review with quality >= 3 increments repetitions", async () => {
		const card = await repo.review("fc_3", 4);
		expect(card).not.toBeNull();
		expect(card?.repetitions).toBe(1);
		expect(typeof card?.interval).toBe("number");
		expect(card?.interval).toBeGreaterThan(0);
		expect(card?.lastReview).not.toBeNull();
	});

	test("review with quality < 3 resets repetitions", async () => {
		const card = await repo.review("fc_4", 1);
		expect(card).not.toBeNull();
		expect(card?.repetitions).toBe(0);
		expect(card?.interval).toBe(0);
	});

	test("getStats returns correct counts", async () => {
		const stats = await repo.getStats();
		expect(stats.total).toBeGreaterThan(0);
		expect(stats.total).toBe(storedCards.length);
		expect(stats.avgEaseFactor).toBeGreaterThan(0);
	});

	test("getGrouped returns cards grouped by subject", async () => {
		const grouped = await repo.getGrouped();
		const subjects = Object.keys(grouped);
		expect(subjects.length).toBeGreaterThan(0);
		for (const subject of subjects) {
			expect(grouped[subject].every((c) => c.subject === subject)).toBe(true);
		}
	});
});
