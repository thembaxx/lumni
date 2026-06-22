import { describe, expect, test, vi } from "vitest";

const { mockCreateDocument, mockGetDocument } = vi.hoisted(() => ({
  mockCreateDocument: vi.fn(() => Promise.resolve()),
  mockGetDocument: vi.fn(() => Promise.resolve(null)),
}));

vi.mock("@/lib/shared/json", () => ({
  safeJsonParse: (str: string, fallback: unknown) => {
    try {
      return JSON.parse(str);
    } catch {
      return fallback;
    }
  },
  safeJsonStringify: (value: unknown) => JSON.stringify(value),
}));

vi.mock("@/lib/appwrite", () => ({
  APPWRITE_ENDPOINT: "https://jnb.cloud.appwrite.io/v1",
  APPWRITE_PROJECT: "test-project",
  browserDatabases: {},
  storage: {},
  functions: {},
  account: {},
}));

vi.mock("@/lib/appwrite.server", () => ({
  APPWRITE_ENDPOINT: "https://jnb.cloud.appwrite.io/v1",
  APPWRITE_PROJECT: "test-project",
  APPWRITE_API_KEY: "test-key",
  databases: {
    createDocument: mockCreateDocument,
    getDocument: mockGetDocument,
  },
  serverAccount: {},
  serverClient: {},
}));

vi.mock("@/lib/db/client", () => {
  const _mockFn = vi.fn();
  return {
    APPWRITE_DATABASE_ID: "test-db-id",
    COLLECTIONS: {
      VISUALS: "visuals",
      SUBJECTS: "subjects",
      QUESTIONS: "questions",
      USER_PROGRESS: "user_progress",
      STUDY_SESSIONS: "study_sessions",
      EXAM_PAPERS: "exam_papers",
      COMPETENCIES: "competencies",
      FLASHCARDS: "flashcards",
      WRONG_ANSWERS: "wrong_answers",
      BOOKMARKS: "bookmarks",
      CHAT_MESSAGES: "chat_messages",
      STUDY_PLANS: "study_plans",
      EXAM_DATES: "exam_dates",
      USER_CONSENTS: "user_consents",
      SHARED_QUESTIONS: "shared_questions",
    },
    createDocument: vi.fn(async () => {}),
    listDocuments: vi.fn(async () => []),
    getDocument: vi.fn(async () => null),
    updateDocument: vi.fn(async () => {}),
    deleteDocument: vi.fn(async () => {}),
  };
});

const { loadVisualFromAppwrite, saveVisualToAppwrite } = await import("../visual-persistence");

const sampleVisual = {
  type: "konva-diagram" as const,
  label: "Test Diagram",
  diagramType: "wave",
  diagramData: { amplitude: 10, frequency: 5, type: "transverse" },
};

describe("saveVisualToAppwrite", () => {
  test("runs without error", async () => {
    await expect(saveVisualToAppwrite("q1", "mathematics", sampleVisual)).resolves.toBeUndefined();
  });

  test("handles null visual", async () => {
    await expect(saveVisualToAppwrite("q1", "math", null)).resolves.toBeUndefined();
  });
});

describe("loadVisualFromAppwrite", () => {
  test("returns null when no document found", async () => {
    mockGetDocument.mockReset();
    mockGetDocument.mockResolvedValue(null);

    const result = await loadVisualFromAppwrite("q1", "mathematics");
    expect(result).toBeNull();
  });

  test("returns null when document does not exist (error)", async () => {
    mockGetDocument.mockReset();
    mockGetDocument.mockRejectedValue(new Error("Document not found"));

    const result = await loadVisualFromAppwrite("q1", "math");
    expect(result).toBeNull();
  });

  test("returns visual when document found and not expired", async () => {
    mockGetDocument.mockReset();
    mockGetDocument.mockResolvedValue({
      visual: JSON.stringify(sampleVisual),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    });

    const result = await loadVisualFromAppwrite("q1", "mathematics");
    expect(result).not.toBeNull();
    expect(result?.type).toBe("konva-diagram");
    expect(result?.diagramType).toBe("wave");
  });

  test("returns null when document is expired", async () => {
    mockGetDocument.mockReset();
    mockGetDocument.mockResolvedValue({
      visual: JSON.stringify(sampleVisual),
      expiresAt: new Date(Date.now() - 86400000).toISOString(),
    });

    const result = await loadVisualFromAppwrite("q1", "mathematics");
    expect(result).toBeNull();
  });

  test("calls getDocument with correct params", async () => {
    mockGetDocument.mockReset();
    mockGetDocument.mockResolvedValue({
      visual: JSON.stringify(sampleVisual),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    });

    await loadVisualFromAppwrite("q-test", "life-sciences");

    expect(mockGetDocument).toHaveBeenCalledWith("test-db-id", "visuals", "q-test-life-sciences");
  });
});
