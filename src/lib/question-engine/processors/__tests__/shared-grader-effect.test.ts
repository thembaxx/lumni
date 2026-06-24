import { Effect } from "effect";
import { describe, expect, test, vi } from "vitest";

vi.mock("@/lib/ai", () => ({
  getAI: () => ({
    generateWithSystem: vi.fn(),
  }),
  isAIConfigured: () => true,
  initAI: () => {},
}));

import { PromptManager } from "../../prompt-manager";
import type { Question, UserAnswer } from "../../types";
import { aiGradeResultEffect, aiHintFactoryEffect } from "../graders/shared";

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

function runEffect<A>(effect: Effect.Effect<A>): Promise<A> {
  return Effect.runPromise(effect);
}

describe("aiGradeResultEffect", () => {
  test("empty answer returns failure without AI call", async () => {
    const q = makeQuestion();
    const result = await runEffect(
      aiGradeResultEffect(q, makeAnswer(""), prompts, undefined as never, () => ""),
    );
    expect(result.correct).toBe(false);
    expect(result.score).toBe(0);
    expect(result.feedback).toContain("No answer");
  });

  test("null answer returns failure without AI call", async () => {
    const q = makeQuestion();
    const result = await runEffect(
      aiGradeResultEffect(q, makeAnswer(null), prompts, undefined as never, () => ""),
    );
    expect(result.correct).toBe(false);
    expect(result.feedback).toContain("No answer");
  });

  test("empty array answer returns failure without AI call", async () => {
    const q = makeQuestion();
    const result = await runEffect(
      aiGradeResultEffect(q, makeAnswer([]), prompts, undefined as never, () => ""),
    );
    expect(result.correct).toBe(false);
    expect(result.feedback).toContain("No answer");
  });

  test("falls back when AI throws and fallback returns result", async () => {
    const q = makeQuestion();
    const ai = {
      generateWithSystem: vi.fn().mockRejectedValue(new Error("AI unavailable")),
    };
    const result = await runEffect(
      aiGradeResultEffect(
        q,
        makeAnswer("4"),
        prompts,
        ai as never,
        () => "context string",
        () => ({ correct: true, score: 5, maxScore: 5, feedback: "Fallback OK" }),
      ),
    );
    expect(result.correct).toBe(true);
    expect(result.feedback).toContain("Fallback");
    expect(ai.generateWithSystem).toHaveBeenCalledOnce();
  });

  test("returns default failure when AI throws and no fallback", async () => {
    const q = makeQuestion();
    const ai = {
      generateWithSystem: vi.fn().mockRejectedValue(new Error("AI unavailable")),
    };
    const result = await runEffect(
      aiGradeResultEffect(q, makeAnswer("4"), prompts, ai as never, () => "context string"),
    );
    expect(result.correct).toBe(false);
    expect(result.feedback).toContain("Unable to grade");
  });

  test("returns AI result when AI returns valid JSON", async () => {
    const q = makeQuestion();
    const ai = {
      generateWithSystem: vi.fn().mockResolvedValue({
        content: JSON.stringify({ correct: true, score: 5, feedback: "Great!" }),
        provider: "mock",
        model: "mock",
      }),
    };
    const result = await runEffect(
      aiGradeResultEffect(q, makeAnswer("4"), prompts, ai as never, () => "context string"),
    );
    expect(result.correct).toBe(true);
    expect(result.score).toBe(5);
    expect(result.feedback).toBe("Great!");
  });

  test("uses fallback when AI returns unparseable content", async () => {
    const q = makeQuestion();
    const ai = {
      generateWithSystem: vi.fn().mockResolvedValue({
        content: "not valid json at all",
        provider: "mock",
        model: "mock",
      }),
    };
    const result = await runEffect(
      aiGradeResultEffect(
        q,
        makeAnswer("4"),
        prompts,
        ai as never,
        () => "context string",
        () => ({ correct: true, score: 3, maxScore: 5, feedback: "Partial credit" }),
      ),
    );
    expect(result.correct).toBe(true);
    expect(result.score).toBe(3);
  });
});

describe("aiHintFactoryEffect", () => {
  test("returns AI generated hint", async () => {
    const q = makeQuestion();
    const ai = {
      generateWithSystem: vi.fn().mockResolvedValue({
        content: "Try thinking about addition.",
        provider: "mock",
        model: "mock",
      }),
    };
    const factory = aiHintFactoryEffect();
    const result = await runEffect(factory(q, prompts, ai as never));
    expect(result).toBe("Try thinking about addition.");
  });

  test("falls back to question hint when AI returns null", async () => {
    const q = makeQuestion();
    const ai = {
      generateWithSystem: vi.fn().mockResolvedValue({
        available: false,
      }),
    };
    const factory = aiHintFactoryEffect();
    const result = await runEffect(factory(q, prompts, ai as never));
    expect(result).toBe("Basic arithmetic");
  });

  test("falls back to question hint when AI throws", async () => {
    const q = makeQuestion();
    const ai = {
      generateWithSystem: vi.fn().mockRejectedValue(new Error("AI unavailable")),
    };
    const factory = aiHintFactoryEffect();
    const result = await runEffect(factory(q, prompts, ai as never));
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
    const factory = aiHintFactoryEffect();
    const result = await runEffect(factory(q, prompts, ai as never, "<ref>source</ref>"));
    expect(result).toBe("A hint from RAG.");
    expect(capturedUser).toContain("<ref>source</ref>");
    expect(capturedSystem).toContain("reference_material");
  });
});

describe("TypedQuestionProcessor effect integration", () => {
  test("gradeEffect returns result via Effect", async () => {
    const { TypedQuestionProcessor } = await import("../processor");
    const processor = new TypedQuestionProcessor(
      "short-answer",
      { generateTemperature: 0.7 },
      // oxlint-disable-next-line typescript/no-this-alias
      (q, a, _pm, _ai) =>
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
    const result = await Effect.runPromise(processor.gradeEffect(q, makeAnswer("4")));
    expect(result.correct).toBe(true);
    expect(result.score).toBe(5);
  });

  test("gradeEffect handles synchronous gradeFn", async () => {
    const { TypedQuestionProcessor } = await import("../processor");
    const processor = new TypedQuestionProcessor(
      "short-answer",
      { generateTemperature: 0.7 },
      // oxlint-disable-next-line typescript/no-this-alias
      (q, _a, _pm, _ai) =>
        ({ correct: false, score: 0, maxScore: q.points, feedback: "Sync fail" }) as never,
      () => "",
      prompts,
    );
    const result = await Effect.runPromise(processor.gradeEffect(makeQuestion(), makeAnswer("x")));
    expect(result.correct).toBe(false);
    expect(result.feedback).toBe("Sync fail");
  });

  test("gradeEffect catches thrown errors from gradeFn", async () => {
    const { TypedQuestionProcessor } = await import("../processor");
    const processor = new TypedQuestionProcessor(
      "short-answer",
      { generateTemperature: 0.7 },
      () => {
        throw new Error("gradeFn crash");
      },
      () => "",
      prompts,
    );
    const result = await Effect.runPromise(processor.gradeEffect(makeQuestion(), makeAnswer("x")));
    expect(result.correct).toBe(false);
    expect(result.feedback).toContain("Grading failed");
  });
});
