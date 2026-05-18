import { describe, expect, test, mock, beforeEach } from "bun:test";
import type { QuestionRating } from "@/lib/db/schema";

const enqueueMock = mock(async () => 1);
const ratingStore: QuestionRating[] = [];

function makeRating(overrides: Partial<QuestionRating> = {}): QuestionRating {
	return {
		id: Math.random(),
		questionId: "q1",
		subject: "mathematics",
		topic: "algebra",
		rating: 4,
		feedback: "Good question",
		createdAt: Date.now(),
		...overrides,
	};
}

const mockRatingsTable = {
	toArray: async () => [...ratingStore],
	where: (field: string) => ({
		equals: (value: string) => ({
			first: async () =>
				ratingStore.find((r) => r[field as keyof QuestionRating] === value) ?? null,
			reverse: () => ({
				toArray: async () =>
					[...ratingStore].filter((r) => r[field as keyof QuestionRating] === value).reverse(),
			}),
		}),
	}),
	orderBy: (_field: string) => ({
		reverse: () => ({
			toArray: async () => [...ratingStore].reverse(),
		}),
	}),
	add: async (record: QuestionRating) => {
		ratingStore.push(record);
		return record.id ?? 1;
	},
	update: async (id: number, record: Partial<QuestionRating>) => {
		const idx = ratingStore.findIndex((r) => r.id === id);
		if (idx >= 0) Object.assign(ratingStore[idx], record);
		return 1;
	},
	filter: () => ({
		toArray: async () => [...ratingStore],
	}),
};

mock.module("@/lib/db/schema", () => ({
	offlineDB: { questionRatings: mockRatingsTable },
}));

mock.module("@/lib/orchestrator/job-queue", () => ({
	enqueue: enqueueMock,
}));

const { QuestionRatingService } = await import("../question-rating-service");

describe("QuestionRatingService", () => {
	const service = new QuestionRatingService();

	beforeEach(() => {
		ratingStore.length = 0;
		enqueueMock.mockReset();
	});

	describe("rate", () => {
		test("adds a new rating", async () => {
			await service.rate({ questionId: "q1", subject: "math", rating: 4 });
			expect(ratingStore).toHaveLength(1);
			expect(ratingStore[0].rating).toBe(4);
		});

		test("clamps rating between 1 and 5", async () => {
			await service.rate({ questionId: "q1", subject: "math", rating: 0 });
			expect(ratingStore[0].rating).toBe(1);
			await service.rate({ questionId: "q2", subject: "math", rating: 10 });
			expect(ratingStore[1].rating).toBe(5);
		});

		test("rounds decimal ratings", async () => {
			await service.rate({ questionId: "q1", subject: "math", rating: 3.6 });
			expect(ratingStore[0].rating).toBe(4);
		});

		test("updates existing rating for same questionId", async () => {
			ratingStore.push(makeRating({ id: 1, questionId: "q1", rating: 3 }));
			await service.rate({ questionId: "q1", subject: "math", rating: 5 });
			expect(ratingStore).toHaveLength(1);
			expect(ratingStore[0].rating).toBe(5);
		});

		test("enqueues appwrite-rating-sync", async () => {
			await service.rate({ questionId: "q1", subject: "math", rating: 4, feedback: "Good" });
			expect(enqueueMock).toHaveBeenCalledWith(
				"appwrite-rating-sync",
				expect.objectContaining({ questionId: "q1", rating: 4, feedback: "Good" }),
			);
		});
	});

	describe("getRatingStats", () => {
		test("returns zeros for empty ratings", async () => {
			const stats = await service.getRatingStats();
			expect(stats.total).toBe(0);
			expect(stats.average).toBe(0);
			expect(stats.counts).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
		});

		test("calculates correct stats", async () => {
			ratingStore.push(
				makeRating({ id: 1, questionId: "q1", rating: 5 }),
				makeRating({ id: 2, questionId: "q2", rating: 3 }),
			);
			const stats = await service.getRatingStats();
			expect(stats.total).toBe(2);
			expect(stats.average).toBe(4);
			expect(stats.counts[5]).toBe(1);
			expect(stats.counts[3]).toBe(1);
		});
	});

	describe("getLowRatedQuestions", () => {
		test("returns empty when no ratings meet threshold", async () => {
			ratingStore.push(
				makeRating({ id: 1, questionId: "q1", rating: 5 }),
				makeRating({ id: 2, questionId: "q1", rating: 5 }),
			);
			const low = await service.getLowRatedQuestions();
			expect(low).toHaveLength(0);
		});

		test("groups ratings by questionId and averages them", async () => {
			ratingStore.push(
				makeRating({ id: 1, questionId: "q1", rating: 1 }),
				makeRating({ id: 2, questionId: "q1", rating: 2 }),
				makeRating({ id: 3, questionId: "q2", rating: 5 }),
				makeRating({ id: 4, questionId: "q2", rating: 5 }),
			);
			const low = await service.getLowRatedQuestions(2, 2);
			expect(low).toHaveLength(1);
			expect(low[0].questionId).toBe("q1");
			expect(low[0].avgRating).toBe(1.5);
			expect(low[0].count).toBe(2);
		});

		test("ignores questions with fewer than minRatings", async () => {
			ratingStore.push(
				makeRating({ id: 1, questionId: "q1", rating: 1 }),
			);
			const low = await service.getLowRatedQuestions(2, 2);
			expect(low).toHaveLength(0);
		});

		test("sorts results by avgRating ascending", async () => {
			ratingStore.push(
				makeRating({ id: 1, questionId: "q3", rating: 1 }),
				makeRating({ id: 2, questionId: "q3", rating: 1 }),
				makeRating({ id: 3, questionId: "q1", rating: 1 }),
				makeRating({ id: 4, questionId: "q1", rating: 2 }),
				makeRating({ id: 5, questionId: "q2", rating: 1 }),
				makeRating({ id: 6, questionId: "q2", rating: 3 }),
			);
			const low = await service.getLowRatedQuestions(2, 2);
			expect(low).toHaveLength(3);
			for (let i = 1; i < low.length; i++) {
				expect(low[i - 1].avgRating).toBeLessThanOrEqual(low[i].avgRating);
			}
		});
	});
});
