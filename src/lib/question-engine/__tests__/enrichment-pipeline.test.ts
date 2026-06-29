import { beforeEach, describe, expect, test, vi } from "vitest";
import { InMemoryDataAccess } from "@/lib/db/in-memory-data-access";
import { __setDepsForTesting, createEnrichmentPipeline } from "../enrichment-pipeline";

vi.mock("@/lib/embedding/client", () => ({
  embedText: vi.fn(),
}));
vi.mock("@/lib/embedding/similarity", () => ({
  findTopK: vi.fn(),
}));
vi.mock("@/lib/shared/logger", () => ({
  logError: vi.fn(),
}));
vi.mock("@/lib/question-engine/adaptive-selector", () => ({
  selectAdaptiveQuestions: vi.fn(),
  recordSeenQuestions: vi.fn(),
}));
vi.mock("@/lib/appwrite", () => {
  const chain = {
    setEndpoint: vi.fn().mockReturnThis(),
    setProject: vi.fn().mockReturnThis(),
  };
  return {
    client: chain,
    storage: {},
    functions: {},
    account: {},
    browserDatabases: {},
  };
});
vi.mock("@/lib/db/client", () => ({
  listDocuments: vi.fn().mockResolvedValue([]),
  COLLECTIONS: { TOPICS: "topics" },
}));

const { embedText: mockEmbedText } = await import("@/lib/embedding/client");
const { findTopK: mockFindTopK } = await import("@/lib/embedding/similarity");
const { selectAdaptiveQuestions: mockSelectAdaptive } =
  await import("@/lib/question-engine/adaptive-selector");
const { recordSeenQuestions: mockRecordSeen } =
  await import("@/lib/question-engine/adaptive-selector");
const { listDocuments: mockListDocuments } = await import("@/lib/db/client");

function makeParams(overrides?: Record<string, unknown>) {
  return {
    subject: "Mathematics",
    topic: "Algebra",
    count: 5,
    ...overrides,
  };
}

describe("enrichment pipeline", () => {
  let db: InMemoryDataAccess;

  beforeEach(() => {
    db = new InMemoryDataAccess();
    __setDepsForTesting({ db });
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    vi.mocked(mockListDocuments).mockResolvedValue([]);
    vi.mocked(mockEmbedText).mockReset();
    vi.mocked(mockFindTopK).mockReset();
    vi.mocked(mockSelectAdaptive).mockReset();
    vi.mocked(mockRecordSeen).mockReset();
  });

  test("merges curriculum context when topic provided", async () => {
    vi.mocked(mockListDocuments).mockResolvedValue([
      {
        $id: "1",
        name: "Algebra",
        description: "Algebra is the study of symbols.",
      },
    ]);

    vi.mocked(mockEmbedText).mockResolvedValue(null);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ questions: [] }) }),
    );

    const pipeline = createEnrichmentPipeline({ db });
    const result = await pipeline.enrich(makeParams());

    expect(result.curriculumContext).toBe("Algebra is the study of symbols.");
  });

  test("populates poolQuestions when similarity > 0.8", async () => {
    vi.mocked(mockEmbedText).mockResolvedValue([0.1, 0.2]);
    vi.mocked(mockFindTopK).mockResolvedValue([
      {
        questionId: "q1",
        questionText: "What is 2+2?",
        answerText: "4",
        marks: 2,
        year: 2023,
        paperNumber: 1,
        topic: "Algebra",
        similarity: 0.9,
        type: "short-answer",
        bloomLevel: "remember",
      },
      {
        questionId: "q2",
        questionText: "Solve x+1=3",
        answerText: "x=2",
        marks: 3,
        year: 2022,
        paperNumber: 2,
        topic: "Algebra",
        similarity: 0.7,
        type: "calculation",
        bloomLevel: "apply",
      },
    ]);

    const pipeline = createEnrichmentPipeline({ db });
    const result = await pipeline.enrich(makeParams());

    expect(result.poolQuestions).toHaveLength(1);
    expect(result.poolQuestions?.[0].id).toBe("q1");
    expect(result.poolQuestions?.[0].similarity).toBe(0.9);
  });

  test("uses embedding examples in 0.5-0.8 range", async () => {
    vi.mocked(mockEmbedText).mockResolvedValue([0.1, 0.2]);
    vi.mocked(mockFindTopK).mockResolvedValue([
      {
        questionId: "q1",
        questionText: "Q1",
        answerText: "A1",
        marks: 2,
        year: 2023,
        paperNumber: 1,
        topic: "Algebra",
        similarity: 0.9,
      },
      {
        questionId: "q2",
        questionText: "Q2",
        answerText: "A2",
        marks: 3,
        year: 2022,
        paperNumber: 2,
        topic: "Algebra",
        similarity: 0.65,
      },
    ]);

    const pipeline = createEnrichmentPipeline({ db });
    const result = await pipeline.enrich(makeParams());

    expect(result.pastPaperExamples).toHaveLength(1);
    expect(result.pastPaperExamples?.[0].questionText).toBe("Q2");
    expect(result.pastPaperExamples?.[0].marks).toBe(3);
  });

  test("falls back to API when embedding examples empty", async () => {
    vi.mocked(mockEmbedText).mockResolvedValue([0.1, 0.2]);
    vi.mocked(mockFindTopK).mockResolvedValue([]);

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        questions: [
          {
            questionText: "API Question",
            answerText: "API Answer",
            marks: 5,
            year: 2024,
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const pipeline = createEnrichmentPipeline({ db });
    const result = await pipeline.enrich(makeParams());

    expect(result.pastPaperExamples).toHaveLength(1);
    expect(result.pastPaperExamples?.[0].questionText).toBe("API Question");
    expect(mockFetch).toHaveBeenCalledOnce();
  });

  test("uses adaptive selection in pastPaperMode", async () => {
    vi.mocked(mockEmbedText).mockResolvedValue([0.1, 0.2]);
    vi.mocked(mockFindTopK).mockResolvedValue([
      {
        questionId: "pp1",
        questionText: "Past paper Q1",
        answerText: "Answer 1",
        marks: 4,
        year: 2023,
        paperNumber: 1,
        topic: "Algebra",
        similarity: 0.85,
        type: "short-answer",
        bloomLevel: "analyze",
      },
    ]);
    vi.mocked(mockSelectAdaptive).mockResolvedValue([
      {
        questionId: "pp1",
        questionText: "Past paper Q1",
        answerText: "Answer 1",
        marks: 4,
        year: 2023,
        paperNumber: 1,
        topic: "Algebra",
        similarity: 0.85,
        type: "short-answer",
        bloomLevel: "analyze",
      },
    ]);

    const pipeline = createEnrichmentPipeline({ db });
    const result = await pipeline.enrich(makeParams({ pastPaperMode: true }));

    expect(mockSelectAdaptive).toHaveBeenCalledOnce();
    expect(mockRecordSeen).toHaveBeenCalledWith(
      ["pp1"],
      "Mathematics",
      expect.objectContaining({ db }),
    );
    expect(result.poolQuestions).toHaveLength(1);
    expect(result.poolQuestions?.[0].id).toBe("pp1");
  });

  test("returns params unchanged when all sources empty", async () => {
    vi.mocked(mockEmbedText).mockResolvedValue(null);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ questions: [] }) }),
    );

    const pipeline = createEnrichmentPipeline({ db });
    const input = makeParams();
    const result = await pipeline.enrich(input);

    expect(result.curriculumContext).toBeUndefined();
    expect(result.poolQuestions).toBeUndefined();
    expect(result.pastPaperExamples).toBeUndefined();
    expect(result.subject).toBe("Mathematics");
    expect(result.topic).toBe("Algebra");
    expect(result.count).toBe(5);
  });
});
