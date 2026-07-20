import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { CompetencyRecord } from "@/lib/competency-engine/types";
import { InMemoryDataAccess } from "@/lib/db/in-memory-data-access";
import type { RetentionRecurrence } from "@/lib/db/types";
import type { FlashcardSM2 } from "@/lib/flashcard-engine/types";
import { __setDepsForTesting, resolveNextAction } from "../next-action";

function makeCard(overrides: Partial<FlashcardSM2> = {}): FlashcardSM2 {
  return {
    id: crypto.randomUUID(),
    front: "Q",
    back: "A",
    subject: "Mathematics",
    topic: "algebra",
    easeFactor: 2.5,
    interval: 1,
    repetitions: 1,
    nextReview: Date.now() - 1000,
    lastReview: Date.now() - 86400000,
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
    algorithm: "sm2",
    stability: 1,
    difficulty: 0.3,
    status: "active",
    lapses: 0,
    learningStep: 0,
    leeched: false,
    ...overrides,
  };
}

function makeRetention(overrides: Partial<RetentionRecurrence> = {}): RetentionRecurrence {
  return {
    questionId: "q1",
    subject: "Mathematics",
    topic: "algebra",
    questionText: "Solve x+2=5",
    correctAnswer: "x=3",
    explanation: "Subtract 2",
    scheduledAt: Date.now() - 1000,
    completed: false,
    ...overrides,
  };
}

function makeCompetency(overrides: Partial<CompetencyRecord> = {}): CompetencyRecord {
  return {
    subjectId: "MATH",
    topicId: "algebra",
    bloomLevel: "remember",
    score: 50,
    attempts: 5,
    lastAssessed: Date.now() - 86400000,
    level: "developing",
    ...overrides,
  };
}

describe("resolveNextAction", () => {
  let db: InMemoryDataAccess;
  let getItemSpy: ReturnType<typeof vi.fn>;
  let setItemSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-21T10:00:00"));
    db = new InMemoryDataAccess();
    __setDepsForTesting({ db });

    getItemSpy = vi.fn(() => null);
    setItemSpy = vi.fn();
    vi.stubGlobal("localStorage", {
      getItem: getItemSpy,
      setItem: setItemSpy,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test("returns due-cards when more than 5 flashcards are due", async () => {
    const now = Date.now();
    const cards: FlashcardSM2[] = Array.from({ length: 6 }, (_, i) =>
      makeCard({ id: `card-${i}`, nextReview: now - 1000 }),
    );
    db.flashcards.seed(cards);

    const result = await resolveNextAction();

    expect(result).not.toBeNull();
    expect(result?.kind).toBe("due-cards");
    expect(result?.ctaHref).toBe("/flashcards");
  });

  test("returns due-cards with correct count in title", async () => {
    const now = Date.now();
    const cards: FlashcardSM2[] = Array.from({ length: 10 }, (_, i) =>
      makeCard({ id: `card-${i}`, nextReview: now - 1000 }),
    );
    db.flashcards.seed(cards);

    const result = await resolveNextAction();

    expect(result?.title).toBe("10 flashcards due!");
  });

  test("skips due-cards when dismissed", async () => {
    const now = Date.now();
    const cards: FlashcardSM2[] = Array.from({ length: 6 }, (_, i) =>
      makeCard({ id: `card-${i}`, nextReview: now - 1000 }),
    );
    db.flashcards.seed(cards);

    getItemSpy.mockImplementation((key: string) => {
      if (key === "lumni_next_action_dismiss") {
        return JSON.stringify([["due-cards", now + 3600000]]);
      }
      return null;
    });

    const result = await resolveNextAction();

    expect(result).not.toBeNull();
    expect(result?.kind).not.toBe("due-cards");
  });

  test("returns review-mistakes when overdue retention items exist", async () => {
    db.retentionRecurrence.seed([
      makeRetention({ scheduledAt: Date.now() - 1000, completed: false }),
    ]);

    const result = await resolveNextAction();

    expect(result).not.toBeNull();
    expect(result?.kind).toBe("review-mistakes");
    expect(result?.ctaHref).toBe("/review");
  });

  test("skips review-mistakes for completed items", async () => {
    db.retentionRecurrence.seed([
      makeRetention({ scheduledAt: Date.now() - 1000, completed: true }),
    ]);

    const result = await resolveNextAction();

    expect(result).toBeNull();
  });

  test("returns weakest-topic when competencies exist", async () => {
    db.competencies.seed([
      makeCompetency({ subjectId: "MATH", topicId: "algebra", score: 30 }),
      makeCompetency({ subjectId: "MATH", topicId: "geometry", score: 80 }),
    ]);
    db.subjects.seed([
      {
        code: "MATH",
        name: "Mathematics",
        category: "STEM",
        data: "{}",
        cachedAt: Date.now(),
      },
    ]);

    const result = await resolveNextAction();

    expect(result).not.toBeNull();
    expect(result?.kind).toBe("weakest-topic");
    expect(result?.topic).toBe("Algebra");
  });

  test("returns flashcards when 1-5 are due and no other higher-priority action", async () => {
    const now = Date.now();
    db.flashcards.seed([
      makeCard({ id: "c1", nextReview: now - 1000 }),
      makeCard({ id: "c2", nextReview: now - 1000 }),
    ]);

    const result = await resolveNextAction();

    expect(result).not.toBeNull();
    expect(result?.kind).toBe("flashcards");
    expect(result?.ctaHref).toBe("/flashcards");
  });

  test("returns study-plan in evening when no other action available", async () => {
    vi.setSystemTime(new Date("2026-06-21T19:00:00"));

    const result = await resolveNextAction();

    expect(result).not.toBeNull();
    expect(result?.kind).toBe("study-plan");
    expect(result?.ctaHref).toBe("/study-plan");
  });

  test("returns null during daytime when no action available", async () => {
    vi.setSystemTime(new Date("2026-06-21T10:00:00"));

    const result = await resolveNextAction();

    expect(result).toBeNull();
  });

  test("returns null when all action kinds are dismissed", async () => {
    vi.setSystemTime(new Date("2026-06-21T19:00:00"));
    const now = Date.now();
    const dismissals = [
      "due-cards",
      "review-mistakes",
      "weakest-topic",
      "flashcards",
      "study-plan",
    ];
    getItemSpy.mockImplementation((key: string) => {
      if (key === "lumni_next_action_dismiss") {
        return JSON.stringify(dismissals.map((k) => [k, now + 3600000]));
      }
      return null;
    });

    const result = await resolveNextAction();

    expect(result).toBeNull();
  });

  test("respects dismissal cooldown expiry", async () => {
    const now = Date.now();
    // Dismiss due-cards with a timestamp in the past (expired)
    getItemSpy.mockImplementation((key: string) => {
      if (key === "lumni_next_action_dismiss") {
        return JSON.stringify([["due-cards", now - 1000]]);
      }
      return null;
    });

    db.flashcards.seed(
      Array.from({ length: 6 }, (_, i) => makeCard({ id: `card-${i}`, nextReview: now - 1000 })),
    );

    const result = await resolveNextAction();

    expect(result).not.toBeNull();
    expect(result?.kind).toBe("due-cards");
  });

  test("priority order: due-cards > review-mistakes > weakest-topic > flashcards > study-plan", async () => {
    const now = Date.now();
    // Seed everything
    db.flashcards.seed(
      Array.from({ length: 6 }, (_, i) => makeCard({ id: `card-${i}`, nextReview: now - 1000 })),
    );
    db.retentionRecurrence.seed([makeRetention({ scheduledAt: now - 1000, completed: false })]);
    db.competencies.seed([makeCompetency({ subjectId: "MATH", topicId: "algebra", score: 30 })]);
    db.subjects.seed([
      {
        code: "MATH",
        name: "Mathematics",
        category: "STEM",
        data: "{}",
        cachedAt: now,
      },
    ]);

    const result = await resolveNextAction();

    expect(result?.kind).toBe("due-cards");
  });

  test("weak CTA label changes based on time of day", async () => {
    vi.setSystemTime(new Date("2026-06-21T09:00:00"));
    db.competencies.seed([makeCompetency({ subjectId: "MATH", topicId: "algebra", score: 30 })]);
    db.subjects.seed([
      {
        code: "MATH",
        name: "Mathematics",
        category: "STEM",
        data: "{}",
        cachedAt: Date.now(),
      },
    ]);

    const morning = await resolveNextAction();
    expect(morning?.ctaLabel).toBe("Drill 10 questions");

    vi.setSystemTime(new Date("2026-06-21T14:00:00"));
    const afternoon = await resolveNextAction();
    expect(afternoon?.ctaLabel).toBe("Practice now");
  });
});
