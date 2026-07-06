import { describe, expect, test, vi } from "vitest";
import { QuestionEngine } from "../question-engine";
import type { CacheResolver } from "@/lib/caching-strategy";
import type { GenerateResult, GenerationParams, Question } from "../types";

const mockMCQuestion: Question<"multiple-choice"> = {
  id: "q-graded",
  type: "multiple-choice",
  subject: "math",
  topic: "algebra",
  difficulty: "Easy",
  bloomTaxonomy: "remember",
  points: 10,
  questionText: "What is 2+2?",
  hint: "Basic arithmetic",
  explanation: "2+2=4",
  body: {
    options: [
      { id: "A", text: "3", isCorrect: false },
      { id: "B", text: "4", isCorrect: true },
    ],
    correctOptionId: "B",
    allowMultiple: false,
  },
};

const mockShortAnswerQuestion: Question<"short-answer"> = {
  id: "q-sa",
  type: "short-answer",
  subject: "math",
  topic: "algebra",
  difficulty: "Easy",
  bloomTaxonomy: "understand",
  points: 5,
  questionText: "What is the square root of 9?",
  hint: "Think of 3",
  explanation: "3*3=9",
  body: {
    acceptableAnswers: ["3", "three", "Three"],
    caseSensitive: false,
  },
};

function createMockCache(result: GenerateResult): CacheResolver<GenerateResult, GenerationParams> {
  return { resolve: vi.fn().mockResolvedValue(result) };
}

describe("QuestionEngine", () => {
  test("listTypes returns all registered types", () => {
    const engine = new QuestionEngine();
    const types = engine.listTypes();
    expect(types.length).toBeGreaterThanOrEqual(10);
    expect(types).toContain("multiple-choice");
    expect(types).toContain("short-answer");
    expect(types).toContain("calculation");
    expect(types).toContain("essay");
    expect(types).toContain("mixed");
  });

  test("validate returns result for a valid multiple-choice question", () => {
    const engine = new QuestionEngine();
    const result = engine.validate(mockMCQuestion);
    expect(result.isValid).toBe(true);
    expect(result.score).toBeGreaterThan(0);
  });

  test("validate flags question with empty text as not valid", () => {
    const engine = new QuestionEngine();
    const question = {
      id: "q-bad",
      type: "multiple-choice",
      subject: "math",
      topic: "algebra",
      difficulty: "Easy",
      bloomTaxonomy: "remember",
      points: 10,
      questionText: "",
      hint: "",
      explanation: "",
      body: {
        options: [],
        correctOptionId: "",
        allowMultiple: false,
      },
    } as Question;

    const result = engine.validate(question);
    expect(result.isValid).toBe(false);
  });

  test("generate returns questions from cache when available", async () => {
    const mockResult: GenerateResult = { questions: [mockMCQuestion], ragContext: null };
    const engine = new QuestionEngine(undefined, createMockCache(mockResult));
    const result = await engine.generate({
      subject: "math",
      topic: "algebra",
      count: 1,
    });
    expect(result.questions).toHaveLength(1);
    expect(result.questions[0].id).toBe("q-graded");
  });

  test("generate returns empty when cache returns empty", async () => {
    const mockResult: GenerateResult = { questions: [], ragContext: null };
    const engine = new QuestionEngine(undefined, createMockCache(mockResult));
    const result = await engine.generate({
      subject: "math",
      topic: "algebra",
      count: 1,
    });
    expect(result.questions).toHaveLength(0);
  });

  test("generate returns questions when count matches", async () => {
    const questions = [mockMCQuestion, mockMCQuestion];
    const mockResult: GenerateResult = { questions, ragContext: null };
    const engine = new QuestionEngine(undefined, createMockCache(mockResult));
    const result = await engine.generate({
      subject: "math",
      topic: "algebra",
      count: 2,
    });
    expect(result.questions).toHaveLength(2);
  });

  test("grade returns GradingResult with expected shape", async () => {
    const engine = new QuestionEngine();
    const result = await engine.grade(mockMCQuestion, {
      type: "option-ids",
      value: ["B"],
    });
    expect(result).toHaveProperty("feedback");
    expect(result).toHaveProperty("correct");
    expect(result).toHaveProperty("score");
    expect(result).toHaveProperty("maxScore");
  });

  test("grade short-answer via engine delegates to processor", async () => {
    const engine = new QuestionEngine();
    const result = await engine.grade(mockShortAnswerQuestion, {
      type: "text",
      value: "3",
    });
    expect(result).toHaveProperty("correct");
    expect(result).toHaveProperty("feedback");
    expect(result).toHaveProperty("score");
    expect(result).toHaveProperty("maxScore");
  });

  test("generateHint returns a string via engine", async () => {
    const engine = new QuestionEngine();
    const hint = await engine.generateHint({
      questionId: "q1",
      question: mockMCQuestion,
    });
    expect(typeof hint).toBe("string");
  });
});
