import { describe, expect, test } from "vitest";
import { PromptManager } from "../../prompt-manager";
import type { Question } from "../../types";
import { grade } from "../graders/long-answer";

const prompts = new PromptManager();

function makeQuestion(overrides?: Partial<Question<"long-answer">>): Question<"long-answer"> {
  return {
    id: "q1",
    type: "long-answer",
    subject: "history",
    topic: "world-war-2",
    difficulty: "Medium",
    bloomTaxonomy: "analyze",
    points: 15,
    questionText: "Explain the causes of WWII",
    hint: "Consider economic, political, and social factors",
    explanation: "Several key factors led to WWII...",
    body: {
      rubric: [
        { name: "Causes", description: "Identifies key causes", maxScore: 5 },
        {
          name: "Evidence",
          description: "Uses specific examples",
          maxScore: 5,
        },
        {
          name: "Analysis",
          description: "Shows analytical thinking",
          maxScore: 5,
        },
      ],
      modelAnswer:
        "The causes of WWII include the Treaty of Versailles, the rise of fascism, and economic depression...",
      minWords: 50,
      maxWords: 500,
    },
    ...overrides,
  };
}

describe("Long Answer Grader", () => {
  test("fails when answer is too short", async () => {
    const q = makeQuestion();
    const result = await grade(q, { type: "text", value: "Too short" }, prompts);
    expect(result.correct).toBe(false);
    expect(result.score).toBe(0);
    expect(result.feedback).toContain("too short");
  });

  test("empty answer returns no-answer feedback", async () => {
    const q = makeQuestion();
    const result = await grade(q, { type: "text", value: "" }, prompts);
    expect(result.correct).toBe(false);
    expect(result.feedback).toBe("No answer.");
  });
});
