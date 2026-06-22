import { describe, expect, test } from "vitest";
import type { Question } from "@/lib/question-engine/types";
import { validateQuestion } from "..";

function makeQuestion(overrides?: Partial<Question<"long-answer">>): Question<"long-answer"> {
  return {
    id: "q1",
    type: "long-answer",
    subject: "history",
    topic: "ww2",
    difficulty: "Medium",
    bloomTaxonomy: "analyze",
    points: 15,
    questionText: "Explain the causes of WWII",
    hint: "Consider multiple factors",
    explanation: "Several key factors led to WWII",
    body: {
      rubric: [{ name: "Causes", description: "Key causes", maxScore: 5 }],
      modelAnswer:
        "A long model answer that explains the causes of World War II in sufficient detail for grading purposes.",
      minWords: 50,
      maxWords: 500,
    },
    ...overrides,
  };
}

describe("Long Answer Validator", () => {
  test("passes valid question", () => {
    const result = validateQuestion(makeQuestion());
    expect(result.isValid).toBe(true);
  });

  test("fails on empty rubric", () => {
    const result = validateQuestion(
      makeQuestion({
        body: { rubric: [], modelAnswer: "test", minWords: 50, maxWords: 500 },
      }),
    );
    expect(result.isValid).toBe(false);
  });

  test("fails when minWords exceeds maxWords", () => {
    const result = validateQuestion(
      makeQuestion({
        body: {
          rubric: [{ name: "A", description: "desc", maxScore: 5 }],
          modelAnswer: "test answer",
          minWords: 100,
          maxWords: 50,
        },
      }),
    );
    expect(result.isValid).toBe(false);
  });
});
