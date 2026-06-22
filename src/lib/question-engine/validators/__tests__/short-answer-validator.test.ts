import { describe, expect, test } from "vitest";
import type { Question } from "@/lib/question-engine/types";
import { validateQuestion } from "..";

function makeQuestion(overrides?: Partial<Question<"short-answer">>): Question<"short-answer"> {
  return {
    id: "q1",
    type: "short-answer",
    subject: "mathematics",
    topic: "algebra",
    difficulty: "Easy",
    bloomTaxonomy: "remember",
    points: 5,
    questionText: "What is 2 + 2?",
    hint: "Think about addition",
    explanation: "2 + 2 = 4",
    body: {
      modelAnswer: "four",
      acceptableAnswers: ["4", "four"],
      maxLength: 100,
    },
    ...overrides,
  };
}

describe("Short Answer Validator", () => {
  test("passes valid question", () => {
    const result = validateQuestion(makeQuestion());
    expect(result.isValid).toBe(true);
  });

  test("fails on missing model answer", () => {
    const result = validateQuestion(
      makeQuestion({
        body: { modelAnswer: "", acceptableAnswers: [], maxLength: 100 },
      }),
    );
    expect(result.isValid).toBe(false);
  });

  test("warns on no acceptable alternatives", () => {
    const result = validateQuestion(
      makeQuestion({
        body: { modelAnswer: "four", acceptableAnswers: [], maxLength: 100 },
      }),
    );
    expect(result.isValid).toBe(true);
    expect(result.warnings.some((w) => w.field === "acceptableAnswers")).toBe(true);
  });
});
