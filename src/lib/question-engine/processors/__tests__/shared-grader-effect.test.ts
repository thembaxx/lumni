import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";

const mockGenerateObject = vi.hoisted(() => vi.fn());
vi.mock("ai", async () => {
  const actual = await vi.importActual<typeof import("ai")>("ai");
  return { ...actual, generateObject: mockGenerateObject };
});

vi.mock("@/lib/ai", () => ({
  getAI: () => ({
    getModelRef: () => null,
  }),
  isAIConfigured: () => true,
  initAI: () => {},
}));

import { PromptManager } from "../../prompt-manager";
import type { Question, UserAnswer } from "../../types";
import { aiGradeResult, aiHintFactory } from "../graders/shared";

const mockModelRef = { id: "mock-model", provider: "mock-provider" } as never;

const prompts = new PromptManager();

function makeQuestion(overrides?: Partial<Question>): Question {
  return {
    id: "q1",
    type: "short-answer",
    subject: "mathematics",
    topic: "algebra",
    difficulty: "Easy",
    bloomTaxonomy: "remember",
    points: 5,
    questionText: "What is 2+2?",
    hint: "Basic arithmetic",
    explanation: "2+2=4",
    body: {},
    ...overrides,
  };
}

function makeAnswer(value: unknown): UserAnswer {
  return { type: "text", value };
}

beforeEach(() => {
  mockGenerateObject.mockReset();
});

afterEach(() => {
  mockGenerateObject.mockReset();
});

describe("aiGradeResult", () => {
  test("empty answer returns failure without AI call", async () => {
    const q = makeQuestion();
    const result = await aiGradeResult(q, makeAnswer(""), prompts, undefined as never, () => "");
    expect(result.correct).toBe(false);
    expect(result.score).toBe(0);
    expect(result.feedback).toContain("No answer");
  });

  test("null answer returns failure without AI call", async () => {
    const q = makeQuestion();
    const result = await aiGradeResult(q, makeAnswer(null), prompts, undefined as never, () => "");
    expect(result.correct).toBe(false);
    expect(result.feedback).toContain("No answer");
  });

  test("empty array answer returns failure without AI call", async () => {
    const q = makeQuestion();
    const result = await aiGradeResult(q, makeAnswer([]), prompts, undefined as never, () => "");
    expect(result.correct).toBe(false);
    expect(result.feedback).toContain("No answer");
  });

  test("falls back when model not configured and fallback returns result", async () => {
    const q = makeQuestion();
    const ai = { getModelRef: () => null };
    const result = await aiGradeResult(
      q,
      makeAnswer("4"),
      prompts,
      ai as never,
      () => "context string",
      () => ({ correct: true, score: 5, maxScore: 5, feedback: "Fallback OK" }),
    );
    expect(result.correct).toBe(true);
    expect(result.feedback).toContain("Fallback");
  });

  test("returns default failure when model not configured and no fallback", async () => {
    const q = makeQuestion();
    const ai = { getModelRef: () => null };
    const result = await aiGradeResult(
      q,
      makeAnswer("4"),
      prompts,
      ai as never,
      () => "context string",
    );
    expect(result.correct).toBe(false);
    expect(result.feedback).toContain("Unable to grade");
  });

  test("returns AI result when generateObject succeeds", async () => {
    const q = makeQuestion();
    mockGenerateObject.mockResolvedValue({
      object: { correct: true, score: 5, feedback: "Great!" },
      usage: { inputTokens: 10, outputTokens: 20 },
    });
    const ai = { getModelRef: () => ({ model: mockModelRef }) };
    const result = await aiGradeResult(
      q,
      makeAnswer("4"),
      prompts,
      ai as never,
      () => "context string",
    );
    expect(result.correct).toBe(true);
    expect(result.score).toBe(5);
    expect(result.feedback).toBe("Great!");
    expect(mockGenerateObject).toHaveBeenCalledOnce();
  });

  test("falls back when generateObject returns invalid result", async () => {
    const q = makeQuestion();
    mockGenerateObject.mockResolvedValue({
      object: { score: 3 },
      usage: { inputTokens: 10, outputTokens: 20 },
    });
    const ai = { getModelRef: () => ({ model: mockModelRef }) };
    const result = await aiGradeResult(
      q,
      makeAnswer("4"),
      prompts,
      ai as never,
      () => "context string",
      () => ({ correct: true, score: 3, maxScore: 5, feedback: "Partial credit" }),
    );
    expect(result.correct).toBe(true);
    expect(result.score).toBe(3);
    expect(mockGenerateObject).toHaveBeenCalledOnce();
  });
});

describe("aiHintFactory", () => {
  test("returns AI generated hint", async () => {
    const q = makeQuestion();
    const ai = {
      generateWithSystem: vi.fn().mockResolvedValue({
        content: "Try thinking about addition.",
        provider: "mock",
        model: "mock",
      }),
    };
    const factory = aiHintFactory();
    const result = await factory(q, prompts, ai as never);
    expect(result).toBe("Try thinking about addition.");
  });

  test("falls back to question hint when AI returns null", async () => {
    const q = makeQuestion();
    const ai = {
      generateWithSystem: vi.fn().mockResolvedValue({
        available: false,
      }),
    };
    const factory = aiHintFactory();
    const result = await factory(q, prompts, ai as never);
    expect(result).toBe("Basic arithmetic");
  });

  test("falls back to question hint when AI throws", async () => {
    const q = makeQuestion();
    const ai = {
      generateWithSystem: vi.fn().mockRejectedValue(new Error("AI unavailable")),
    };
    const factory = aiHintFactory();
    const result = await factory(q, prompts, ai as never);
    expect(result).toBe("Basic arithmetic");
  });

  test("includes RAG XML when provided", async () => {
    const q = makeQuestion();
    let capturedSystem = "";
    let capturedUser = "";
    const ai = {
      generateWithSystem: vi.fn().mockImplementation(async (sys: string, user: string) => {
        capturedSystem = sys;
        capturedUser = user;
        return { content: "A hint from RAG.", provider: "mock", model: "mock" };
      }),
    };
    const factory = aiHintFactory();
    const result = await factory(q, prompts, ai as never, "<ref>source</ref>");
    expect(result).toBe("A hint from RAG.");
    expect(capturedUser).toContain("<ref>source</ref>");
    expect(capturedSystem).toContain("reference_material");
  });
});

describe("TypedQuestionProcessor grade integration", () => {
  test("grade returns result correctly", async () => {
    const { TypedQuestionProcessor } = await import("../processor");
    const processor = new TypedQuestionProcessor(
      "short-answer",
      { generateTemperature: 0.7 },
      (_q, _a, _pm, _ai) =>
        Promise.resolve({
          correct: true,
          score: 5,
          maxScore: 5,
          feedback: "Correct via gradeFn",
        }),
      () => "",
      prompts,
    );
    const q = makeQuestion();
    const result = await processor.grade(q, makeAnswer("4"));
    expect(result.correct).toBe(true);
    expect(result.score).toBe(5);
  });

  test("grade handles synchronous gradeFn", async () => {
    const { TypedQuestionProcessor } = await import("../processor");
    const processor = new TypedQuestionProcessor(
      "short-answer",
      { generateTemperature: 0.7 },
      (q, _a, _pm, _ai) =>
        ({ correct: false, score: 0, maxScore: q.points, feedback: "Sync fail" }) as never,
      () => "",
      prompts,
    );
    const result = await processor.grade(makeQuestion(), makeAnswer("x"));
    expect(result.correct).toBe(false);
    expect(result.feedback).toBe("Sync fail");
  });
});
