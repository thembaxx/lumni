import { describe, expect, test } from "vitest";
import type { PromptManager } from "../../prompt-manager";
import type { Question } from "../../types";
import { grade } from "../graders/mcq";

function makeQuestion(
  overrides?: Partial<Question<"multiple-choice">>,
): Question<"multiple-choice"> {
  return {
    id: "q1",
    type: "multiple-choice",
    subject: "mathematics",
    topic: "algebra",
    difficulty: "Medium",
    bloomTaxonomy: "understand",
    points: 10,
    questionText: "What is 2 + 2?",
    hint: "Think about basic addition",
    explanation: "2 + 2 equals 4",
    body: {
      options: [
        { id: "A", text: "3", isCorrect: false },
        { id: "B", text: "4", isCorrect: true },
        { id: "C", text: "5", isCorrect: false },
        { id: "D", text: "6", isCorrect: false },
      ],
      correctOptionId: "B",
      allowMultiple: false,
    },
    ...overrides,
  };
}

describe("MCQ Grader", () => {
  test("returns full points for correct single answer", () => {
    const q = makeQuestion();
    const result = grade(q, { type: "option-ids", value: ["B"] }, {} as PromptManager);
    expect(result.correct).toBe(true);
    expect(result.score).toBe(10);
    expect(result.maxScore).toBe(10);
  });

  test("returns zero for incorrect answer", () => {
    const q = makeQuestion();
    const result = grade(q, { type: "option-ids", value: ["A"] }, {} as PromptManager);
    expect(result.correct).toBe(false);
    expect(result.score).toBe(0);
  });

  test("handles multiple correct options when allowed", () => {
    const q = makeQuestion({
      body: {
        options: [
          { id: "A", text: "x=2", isCorrect: true },
          { id: "B", text: "y=3", isCorrect: true },
          { id: "C", text: "x=4", isCorrect: false },
        ],
        correctOptionId: "",
        allowMultiple: true,
      },
    });
    const result = grade(q, { type: "option-ids", value: ["A", "B"] }, {} as PromptManager);
    expect(result.correct).toBe(true);
    expect(result.score).toBe(q.points);
  });

  test("fails if only some correct options selected", () => {
    const q = makeQuestion({
      body: {
        options: [
          { id: "A", text: "x=2", isCorrect: true },
          { id: "B", text: "y=3", isCorrect: true },
          { id: "C", text: "x=4", isCorrect: false },
        ],
        correctOptionId: "",
        allowMultiple: true,
      },
    });
    const result = grade(q, { type: "option-ids", value: ["A"] }, {} as PromptManager);
    expect(result.correct).toBe(false);
  });

  test("empty answer is incorrect", () => {
    const q = makeQuestion();
    const result = grade(q, { type: "option-ids", value: [] }, {} as PromptManager);
    expect(result.correct).toBe(false);
  });
});
