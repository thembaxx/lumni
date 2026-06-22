import { describe, expect, test } from "vitest";
import type { Question } from "@/lib/question-engine/types";
import { validateQuestion } from "..";

function makeQuestion(overrides?: Partial<Question<"diagram">>): Question<"diagram"> {
  return {
    id: "q1",
    type: "diagram",
    subject: "physical-sciences",
    topic: "forces",
    difficulty: "Medium",
    bloomTaxonomy: "understand",
    points: 8,
    questionText: "Label the forces on this diagram",
    hint: "Look at force arrows",
    explanation: "Forces include gravity and normal",
    body: {
      diagramData: { type: "force-vector", title: "Forces", data: {} },
      instructions: "Label each force arrow",
    },
    ...overrides,
  };
}

describe("Diagram Validator", () => {
  test("passes valid question", () => {
    const result = validateQuestion(makeQuestion());
    expect(result.isValid).toBe(true);
  });

  test("fails on missing diagramData", () => {
    const result = validateQuestion(
      makeQuestion({
        body: {
          diagramData: undefined as unknown as never,
          instructions: "Label",
        },
      }),
    );
    expect(result.isValid).toBe(false);
  });

  test("fails on missing instructions", () => {
    const result = validateQuestion(
      makeQuestion({
        body: {
          diagramData: { type: "force-vector", title: "F", data: {} },
          instructions: "",
        },
      }),
    );
    expect(result.isValid).toBe(false);
  });
});
