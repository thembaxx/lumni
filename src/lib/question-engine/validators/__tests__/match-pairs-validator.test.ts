import { describe, expect, test } from "vitest";
import type { Question } from "@/lib/question-engine/types";
import { validateQuestion } from "..";

function makeQuestion(overrides?: Partial<Question<"match-pairs">>): Question<"match-pairs"> {
  return {
    id: "q1",
    type: "match-pairs",
    subject: "mathematics",
    topic: "geometry",
    difficulty: "Medium",
    bloomTaxonomy: "remember",
    points: 4,
    questionText: "Match shapes to properties",
    hint: "Think about characteristics",
    explanation: "Correct matches shown above",
    body: {
      leftItems: [
        { id: "l1", text: "Square" },
        { id: "l2", text: "Circle" },
      ],
      rightItems: [
        { id: "r1", text: "Four equal sides" },
        { id: "r2", text: "No straight edges" },
      ],
      correctMatches: [
        { leftId: "l1", rightId: "r1" },
        { leftId: "l2", rightId: "r2" },
      ],
      shuffle: true,
    },
    ...overrides,
  };
}

describe("MatchPairs Validator", () => {
  test("passes valid question", () => {
    const result = validateQuestion(makeQuestion());
    expect(result.isValid).toBe(true);
    expect(result.score).toBeGreaterThan(80);
  });

  test("fails on less than 2 left items", () => {
    const result = validateQuestion(
      makeQuestion({
        body: {
          leftItems: [{ id: "l1", text: "Only" }],
          rightItems: [{ id: "r1", text: "Match" }],
          correctMatches: [{ leftId: "l1", rightId: "r1" }],
          shuffle: true,
        },
      }),
    );
    expect(result.isValid).toBe(false);
  });

  test("fails when right items count mismatches", () => {
    const result = validateQuestion(
      makeQuestion({
        body: {
          leftItems: [
            { id: "l1", text: "A" },
            { id: "l2", text: "B" },
          ],
          rightItems: [{ id: "r1", text: "Only one" }],
          correctMatches: [{ leftId: "l1", rightId: "r1" }],
          shuffle: true,
        },
      }),
    );
    expect(result.isValid).toBe(false);
  });
});
