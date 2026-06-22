import { beforeEach, describe, expect, test, vi } from "vitest";

const mockGenerateQuestionSet = vi.fn<(params: unknown) => unknown>();
const mockValidate = vi.fn<(q: unknown) => unknown>();
const mockGenerateHint = vi.fn<(params: { questionId: string; question: unknown }) => string>();
const mockGrade = vi.fn<(question: unknown, answer: unknown) => unknown>();
const mockListTypes = vi.fn<() => string[]>();

vi.mock("@/lib/orchestrator", () => ({
  LearningOrchestrator: {
    initialize: async () => ({
      generateQuestionSet: mockGenerateQuestionSet,
    }),
  },
}));

vi.mock("@/lib/question-engine/question-engine", () => ({
  QuestionEngine: vi.fn(function (this: unknown) {
    return {
      validate: mockValidate,
      generateHint: mockGenerateHint,
      grade: mockGrade,
      listTypes: mockListTypes,
    };
  }),
}));

const { GET } = await import("@/app/api/engine/test/route");

describe("GET /api/engine/test", () => {
  beforeEach(() => {
    mockGenerateQuestionSet.mockReset();
    mockValidate.mockReset();
    mockGenerateHint.mockReset();
    mockGrade.mockReset();
    mockListTypes.mockReset();
  });

  test("returns success status when questions are generated", async () => {
    mockGenerateQuestionSet.mockResolvedValue({
      questions: [
        {
          id: "q1",
          type: "multiple-choice",
          questionText: "What is 2+2?",
          body: { options: [{ id: "a", text: "4", isCorrect: true }] },
          points: 1,
        },
      ],
    });
    mockValidate.mockReturnValue({
      score: 100,
      isValid: true,
      errors: [],
      warnings: [],
    });
    mockGenerateHint.mockResolvedValue("Try adding");
    mockGrade.mockResolvedValue({ correct: true, score: 1 });
    mockListTypes.mockReturnValue(["multiple-choice"]);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe("success");
    expect(body.timestamp).toBeDefined();
    expect(body.steps).toBeInstanceOf(Array);
    expect(body.errors).toBeInstanceOf(Array);
    expect(body.errors).toHaveLength(0);
  });

  test("returns partial_failure when no questions generated", async () => {
    mockGenerateQuestionSet.mockResolvedValue({ questions: [] });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe("partial_failure");
    expect(body.errors).toContain("No questions generated");
  });

  test("returns failure status when orchestrator throws", async () => {
    mockGenerateQuestionSet.mockRejectedValue(new Error("API failure"));

    const res = await GET();
    const body = await res.json();

    expect(body.status).toBe("failure");
    expect(body.errors).toHaveLength(1);
    expect(body.errors[0]).toContain("API failure");
  });

  test("includes steps array with engine initialization message", async () => {
    mockGenerateQuestionSet.mockResolvedValue({
      questions: [
        {
          id: "q1",
          type: "multiple-choice",
          questionText: "Test question",
          body: { options: [{ id: "a", text: "Yes", isCorrect: true }] },
          points: 1,
        },
      ],
    });
    mockValidate.mockReturnValue({
      score: 100,
      isValid: true,
      errors: [],
      warnings: [],
    });
    mockGenerateHint.mockResolvedValue("Hint");
    mockGrade.mockResolvedValue({ correct: true, score: 1 });
    mockListTypes.mockReturnValue(["multiple-choice"]);

    const res = await GET();
    const body = await res.json();

    expect(body.steps).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Initializing"),
        expect.stringContaining("initialized"),
      ]),
    );
  });
});
