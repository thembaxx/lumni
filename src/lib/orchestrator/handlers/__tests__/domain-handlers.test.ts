import { describe, expect, test, vi } from "vitest";

const mockCreateDocument = vi.fn(() => "doc-id");
const mockListDocuments = vi.fn(() => []);
const mockUpdateDocument = vi.fn(() => {});
const mockDeleteDocument = vi.fn(() => {});

vi.mock("@/lib/appwrite", () => ({
  databases: {
    createDocument: mockCreateDocument,
  },
}));

vi.mock("@/lib/db/client", () => ({
  APPWRITE_DATABASE_ID: "test-db",
  COLLECTIONS: {
    QUESTIONS: "questions",
    USER_PROGRESS: "user_progress",
    COMPETENCIES: "competencies",
    STUDY_SESSIONS: "study_sessions",
    FLASHCARDS: "flashcards",
    WRONG_ANSWERS: "wrong_answers",
    CHAT_MESSAGES: "chat_messages",
    STUDY_PLANS: "study_plans",
    QUESTION_FLAGS: "question_flags",
  },
  createDocument: mockCreateDocument,
  listDocuments: mockListDocuments,
  updateDocument: mockUpdateDocument,
  deleteDocument: mockDeleteDocument,
}));

vi.mock("@/lib/db/persist", () => ({
  safePersist: async (_label: string, fn: () => Promise<void>) => fn(),
}));

vi.mock("@/lib/curriculum", () => ({
  curriculumRegistry: {
    getSubject: async () => null,
  },
}));

vi.mock("@/lib/competency-engine", () => ({
  competencyService: { update: async () => {} },
  computeBloomWeight: () => 1.0,
}));

vi.mock("@/lib/visual-engine/visual-engine", () => ({
  visualEngine: { resolve: async () => null },
}));

vi.mock("@/lib/flashcard-repository", () => ({
  flashcardRepository: {
    getAll: async () => [],
    create: async () => ({ id: "new" }),
    update: async () => {},
  },
}));

vi.mock("@/lib/orchestrator/job-queue", () => ({
  enqueue: async () => 1,
  queueCore: { enqueue: async (_item: { type: string }) => 1 },
}));

vi.mock("@/lib/shared/question-utils", () => ({
  extractCorrectAnswer: () => "42",
}));

vi.mock("@/lib/question-engine/persistence", () => ({
  syncQuestionsToAppwrite: async () => {},
}));

vi.mock("@/lib/db/schema", () => ({
  offlineDB: {
    jobs: {
      add: async () => 1,
      get: async () => null,
      update: async () => 1,
      where: () => ({
        equals: () => ({
          count: async () => 0,
          toArray: async () => [],
        }),
      }),
      toArray: async () => [],
    },
  },
  LumniOfflineDB: class {},
  CachedProgress: class {},
}));

const { analyticsSync, visualGeneration } = await import("../domain");
const { getHandler } = await import("../index");

describe("analyticsSync", () => {
  test("processes empty events", async () => {
    await analyticsSync({ events: [] });
    expect(mockCreateDocument).not.toHaveBeenCalled();
  });
});

describe("visualGeneration", () => {
  test("accepts minimal payload", async () => {
    await visualGeneration({
      questionId: "q1",
      questionText: "test",
      subject: "mathematics",
    });
  });
});

describe("sync handlers", () => {
  test("appwrite-flashcard-delete runs without error", async () => {
    const handler = getHandler("appwrite-flashcard-delete");
    await expect(handler({ id: "fc-1" })).resolves.toBeUndefined();
  });

  test("prune-stale-questions runs without error", async () => {
    const handler = getHandler("prune-stale-questions");
    await expect(handler({})).resolves.toBeUndefined();
  });

  test("generate-embedding runs without error", async () => {
    const handler = getHandler("generate-embedding");
    await expect(
      handler({ questionId: "q1", questionText: "test", subject: "math" }),
    ).resolves.toBeUndefined();
  });
});

describe("handler registry", () => {
  test("getHandler returns a function for every job type", () => {
    const types = [
      "appwrite-sync",
      "analytics-sync",
      "spaced-rep-update",
      "progress-update",
      "visual-generation",
      "appwrite-progress-sync",
      "appwrite-attempt-sync",
      "appwrite-competency-sync",
      "appwrite-flashcard-sync",
      "appwrite-flashcard-pull",
      "appwrite-flashcard-delete",
      "appwrite-wrong-answer-sync",
      "appwrite-bookmark-delete",
      "appwrite-chat-sync",
      "appwrite-rating-sync",
      "appwrite-study-plan-sync",
      "appwrite-question-flag",
      "question-regen",
      "appwrite-exam-dates-sync",
      "appwrite-consent-sync",
      "appwrite-shared-question-sync",
      "appwrite-visual-sync",
      "prune-stale-questions",
      "generate-embedding",
    ] as const;

    for (const type of types) {
      const handler = getHandler(type);
      expect(handler).toBeInstanceOf(Function);
    }
  });

  test("getHandler throws for unknown type", () => {
    expect(() => getHandler("unknown" as never)).toThrow("No handler registered");
  });
});
