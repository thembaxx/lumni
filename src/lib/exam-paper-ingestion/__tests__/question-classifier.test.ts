import { beforeEach, describe, expect, test, vi } from "vitest";

const mockGenerateWithSystem = vi.fn();

vi.mock("@/lib/ai/client", () => ({
  getAI: vi.fn(),
}));

import type { AIClient } from "@/lib/ai/client";
import { classifyQuestions } from "../question-classifier";

const CURRICULUM_TOPICS = [
  {
    id: "sub-1",
    subject: "mathematics",
    topic: "Algebra",
    subtopic: "Linear Equations",
  },
  {
    id: "sub-2",
    subject: "mathematics",
    topic: "Algebra",
    subtopic: "Quadratic Equations",
  },
  {
    id: "sub-3",
    subject: "mathematics",
    topic: "Geometry",
    subtopic: "Circle Theorems",
  },
  {
    id: "sub-4",
    subject: "mathematics",
    topic: "Statistics",
    subtopic: "Mean and Median",
  },
];

function makeQuestions(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `q-${i + 1}`,
    questionText: `Question ${i + 1}: Solve the equation for x`,
    subject: "mathematics",
  }));
}

function makeAI(): AIClient {
  return {
    generateWithSystem: mockGenerateWithSystem,
  } as unknown as AIClient;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("classifyQuestions", () => {
  test("returns map of questionId → subtopicId", async () => {
    const questions = makeQuestions(2);
    mockGenerateWithSystem.mockResolvedValue({
      content: JSON.stringify({ "q-1": "sub-1", "q-2": "sub-3" }),
    });

    const result = await classifyQuestions(questions, CURRICULUM_TOPICS, makeAI());

    expect(result).toBeInstanceOf(Map);
    expect(result.size).toBe(2);
    expect(result.get("q-1")).toBe("sub-1");
    expect(result.get("q-2")).toBe("sub-3");
  });

  test("handles empty questions array", async () => {
    const result = await classifyQuestions([], CURRICULUM_TOPICS, makeAI());

    expect(result).toBeInstanceOf(Map);
    expect(result.size).toBe(0);
    expect(mockGenerateWithSystem).not.toHaveBeenCalled();
  });

  test("filters out invalid subtopicIds from AI response", async () => {
    const questions = makeQuestions(2);
    mockGenerateWithSystem.mockResolvedValue({
      content: JSON.stringify({
        "q-1": "sub-1",
        "q-2": "nonexistent-id",
      }),
    });

    const result = await classifyQuestions(questions, CURRICULUM_TOPICS, makeAI());

    expect(result.size).toBe(1);
    expect(result.get("q-1")).toBe("sub-1");
    expect(result.has("q-2")).toBe(false);
  });

  test("batches questions correctly when more than 50", async () => {
    const questions = makeQuestions(55);
    mockGenerateWithSystem
      .mockResolvedValueOnce({
        content: JSON.stringify(
          Object.fromEntries(Array.from({ length: 50 }, (_, i) => [`q-${i + 1}`, "sub-2"])),
        ),
      })
      .mockResolvedValueOnce({
        content: JSON.stringify({ "q-51": "sub-3", "q-52": "sub-3" }),
      });

    const result = await classifyQuestions(questions, CURRICULUM_TOPICS, makeAI());

    expect(mockGenerateWithSystem).toHaveBeenCalledTimes(2);
    expect(result.size).toBe(52);
    expect(result.get("q-1")).toBe("sub-2");
    expect(result.get("q-51")).toBe("sub-3");
  });

  test("uses provided AI client when given", async () => {
    const questions = makeQuestions(1);
    const customAI = {
      generateWithSystem: vi.fn().mockResolvedValue({
        content: JSON.stringify({ "q-1": "sub-4" }),
      }),
    } as unknown as AIClient;

    const result = await classifyQuestions(questions, CURRICULUM_TOPICS, customAI);

    expect(customAI.generateWithSystem).toHaveBeenCalledTimes(1);
    expect(result.get("q-1")).toBe("sub-4");
  });

  test("returns empty map when AI returns invalid JSON", async () => {
    const questions = makeQuestions(1);
    mockGenerateWithSystem.mockResolvedValue({
      content: "not valid json at all",
    });

    const result = await classifyQuestions(questions, CURRICULUM_TOPICS, makeAI());

    expect(result.size).toBe(0);
  });

  test("handles AI returning empty response gracefully", async () => {
    const questions = makeQuestions(1);
    mockGenerateWithSystem.mockResolvedValue({
      content: "",
    });

    const result = await classifyQuestions(questions, CURRICULUM_TOPICS, makeAI());

    expect(result.size).toBe(0);
  });
});
