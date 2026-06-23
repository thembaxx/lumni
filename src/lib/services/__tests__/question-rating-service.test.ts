import { beforeEach, describe, expect, test, vi } from "vitest";
import type { QuestionRatingRepository } from "@/lib/db/repositories/question-rating-repository";
import type { QuestionRating } from "@/lib/db/schema";

const enqueueMock = vi.fn(async () => 1);
const ratingStore: QuestionRating[] = [];

let currentId = 1;

function makeRating(overrides: Partial<QuestionRating> = {}): QuestionRating {
  return {
    id: currentId++,
    questionId: "q1",
    subject: "mathematics",
    topic: "algebra",
    rating: 4,
    feedback: "Good question",
    createdAt: Date.now(),
    ...overrides,
  };
}

class MockQuestionRatingRepository implements QuestionRatingRepository {
  async findByQuestionId(questionId: string): Promise<QuestionRating | undefined> {
    return ratingStore.find((r) => r.questionId === questionId);
  }

  async upsert(
    id: number | undefined,
    record: Partial<QuestionRating> & { createdAt: number },
  ): Promise<void> {
    if (id) {
      const idx = ratingStore.findIndex((r) => r.id === id);
      if (idx >= 0) Object.assign(ratingStore[idx], record);
    } else {
      ratingStore.push({ ...record, id: currentId++ } as QuestionRating);
    }
  }

  async getAll(): Promise<QuestionRating[]> {
    return [...ratingStore].toReversed();
  }

  async getBySubject(subject: string): Promise<QuestionRating[]> {
    return ratingStore.filter((r) => r.subject === subject).toReversed();
  }
}

vi.mock("@/lib/orchestrator/job-queue", () => ({
  enqueue: enqueueMock,
}));

const { QuestionRatingService } = await import("../question-rating-service");

describe("QuestionRatingService", () => {
  const service = new QuestionRatingService(new MockQuestionRatingRepository());

  beforeEach(() => {
    ratingStore.length = 0;
    currentId = 1;
    enqueueMock.mockReset();
  });

  describe("rate", () => {
    test("adds a new rating", async () => {
      const result = await service.rate({
        questionId: "q1",
        subject: "math",
        rating: 4,
      });
      expect(result.success).toBe(true);
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
      await service.rate({
        questionId: "q1",
        subject: "math",
        rating: 4,
        feedback: "Good",
      });
      expect(enqueueMock).toHaveBeenCalledWith(
        "appwrite-rating-sync",
        expect.objectContaining({
          questionId: "q1",
          rating: 4,
          feedback: "Good",
        }),
      );
    });
  });

  describe("getRatingStats", () => {
    test("returns zeros for empty ratings", async () => {
      const result = await service.getRatingStats();
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.total).toBe(0);
      expect(result.data.average).toBe(0);
      expect(result.data.counts).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
    });

    test("calculates correct stats", async () => {
      ratingStore.push(
        makeRating({ id: 1, questionId: "q1", rating: 5 }),
        makeRating({ id: 2, questionId: "q2", rating: 3 }),
      );
      const result = await service.getRatingStats();
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.total).toBe(2);
      expect(result.data.average).toBe(4);
      expect(result.data.counts[5]).toBe(1);
      expect(result.data.counts[3]).toBe(1);
    });
  });

  describe("getLowRatedQuestions", () => {
    test("returns empty when no ratings meet threshold", async () => {
      ratingStore.push(
        makeRating({ id: 1, questionId: "q1", rating: 5 }),
        makeRating({ id: 2, questionId: "q1", rating: 5 }),
      );
      const result = await service.getLowRatedQuestions();
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data).toHaveLength(0);
    });

    test("groups ratings by questionId and averages them", async () => {
      ratingStore.push(
        makeRating({ id: 1, questionId: "q1", rating: 1 }),
        makeRating({ id: 2, questionId: "q1", rating: 2 }),
        makeRating({ id: 3, questionId: "q2", rating: 5 }),
        makeRating({ id: 4, questionId: "q2", rating: 5 }),
      );
      const result = await service.getLowRatedQuestions(2, 2);
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data).toHaveLength(1);
      expect(result.data[0].questionId).toBe("q1");
      expect(result.data[0].avgRating).toBe(1.5);
      expect(result.data[0].count).toBe(2);
    });

    test("ignores questions with fewer than minRatings", async () => {
      ratingStore.push(makeRating({ id: 1, questionId: "q1", rating: 1 }));
      const result = await service.getLowRatedQuestions(2, 2);
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data).toHaveLength(0);
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
      const result = await service.getLowRatedQuestions(2, 2);
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data).toHaveLength(3);
      for (let i = 1; i < result.data.length; i++) {
        expect(result.data[i - 1].avgRating).toBeLessThanOrEqual(result.data[i].avgRating);
      }
    });
  });
});
