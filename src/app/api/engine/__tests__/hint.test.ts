import { beforeEach, describe, expect, test, vi } from "vitest";

const mockCheckBudget = vi.fn<(req: unknown, type: string) => unknown>();
const mockTrackUsage = vi.fn<(type: string, userId: string) => void>();
const mockWithRateLimit = vi.fn((handler: unknown) => handler);

vi.mock("@/lib/ai/with-budget", () => ({
  checkBudget: mockCheckBudget,
  trackUsage: mockTrackUsage,
}));

vi.mock("@/lib/shared/with-rate-limit", () => ({
  withRateLimit: mockWithRateLimit,
}));

const mockGenerateHint = vi.fn<(params: { questionId: string; question: unknown }) => string>();

vi.mock("@/lib/question-engine/question-engine", () => ({
  QuestionEngine: {
    initialize: async () => ({
      generateHint: mockGenerateHint,
    }),
  },
}));

const { NextRequest } = await import("next/server");
const { POST } = await import("@/app/api/engine/hint/route");

describe("POST /api/engine/hint", () => {
  beforeEach(() => {
    mockCheckBudget.mockReset();
    mockTrackUsage.mockReset();
    mockWithRateLimit.mockReset();
    mockGenerateHint.mockReset();
  });

  const mockQuestion = {
    id: "q1",
    type: "multiple-choice",
    subject: "math",
    topic: "algebra",
    difficulty: "Easy",
    bloomTaxonomy: "remember",
    points: 1,
    questionText: "What is 2+2?",
    hint: "",
    explanation: "",
    body: {
      options: [
        { id: "a", text: "3", isCorrect: false },
        { id: "b", text: "4", isCorrect: true },
      ],
      correctOptionId: "b",
      allowMultiple: false,
    },
  };

  test("parseBody accepts question and returns hint", async () => {
    mockCheckBudget.mockResolvedValue({ allowed: true, userId: "test-user" });
    mockGenerateHint.mockResolvedValue("Try adding 2 and 2 together");

    const req = new NextRequest("http://localhost/api/engine/hint", {
      method: "POST",
      body: JSON.stringify({ question: mockQuestion }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ hint: "Try adding 2 and 2 together" });
  });

  test("validate: missing question returns 400", async () => {
    mockCheckBudget.mockResolvedValue({ allowed: true, userId: "test-user" });

    const req = new NextRequest("http://localhost/api/engine/hint", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ error: "Question is required" });
    expect(mockGenerateHint).not.toHaveBeenCalled();
  });

  test("validate: missing question.id returns 400", async () => {
    mockCheckBudget.mockResolvedValue({ allowed: true, userId: "test-user" });

    const req = new NextRequest("http://localhost/api/engine/hint", {
      method: "POST",
      body: JSON.stringify({ question: { type: "multiple-choice" } }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ error: "Question is required" });
  });

  test("execute calls QuestionEngine.generateHint with correct params", async () => {
    mockCheckBudget.mockResolvedValue({ allowed: true, userId: "test-user" });
    mockGenerateHint.mockResolvedValue("Here is your hint");

    const req = new NextRequest("http://localhost/api/engine/hint", {
      method: "POST",
      body: JSON.stringify({ question: mockQuestion }),
    });

    await POST(req);

    expect(mockGenerateHint).toHaveBeenCalledWith({
      questionId: "q1",
      question: mockQuestion,
    });
  });
});
