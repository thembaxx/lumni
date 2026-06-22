import { describe, expect, test, vi } from "vitest";
import { QuestionEngine } from "@/lib/question-engine/question-engine";
import type { GenerationParams, Question } from "@/lib/question-engine/types";
import { LearningOrchestrator } from "../learning-orchestrator";

describe("LearningOrchestrator", () => {
  test("composes QuestionEngine", () => {
    const engine = new QuestionEngine();
    const orchestrator = new LearningOrchestrator(engine);
    expect(orchestrator).toBeDefined();
  });

  test("generateQuestionSet surfaces ragContext as sources", async () => {
    const questions: Question[] = [
      {
        id: "q1",
        type: "multiple-choice",
        subject: "mathematics",
        topic: "algebra",
        difficulty: "Medium",
        bloomTaxonomy: "apply",
        points: 10,
        questionText: "What is 2+2?",
        hint: "Think basic",
        explanation: "2+2=4",
        body: {
          options: [
            { id: "A", text: "3", isCorrect: false },
            { id: "B", text: "4", isCorrect: true },
          ],
          correctOptionId: "B",
          allowMultiple: false,
        },
      },
    ];

    const fakeEngine = {
      generate: vi.fn(async (_params: GenerationParams) => ({
        questions,
        ragContext: {
          sources: [
            {
              url: "https://www.education.gov.za/Curriculum/",
              title: "DBE Curriculum",
              snippet: "...",
              content: "...",
              contentTruncated: false,
            },
            {
              url: "https://wced.school.za",
              title: "WCED Past Papers",
              snippet: "...",
              content: "...",
              contentTruncated: false,
            },
          ],
          xml: "<reference_material ...></reference_material>",
          domainsQueried: ["education.gov.za", "wced.school.za"],
        },
      })),
    };

    const orchestrator = new LearningOrchestrator(fakeEngine as unknown as QuestionEngine);

    const result = await orchestrator.generateQuestionSet({
      subject: "mathematics",
      count: 1,
    });

    expect(result.sources).toEqual([
      {
        url: "https://www.education.gov.za/Curriculum/",
        title: "DBE Curriculum",
      },
      { url: "https://wced.school.za", title: "WCED Past Papers" },
    ]);
  });

  test("generateQuestionSet returns empty sources when no RAG context", async () => {
    const questions: Question[] = [
      {
        id: "q1",
        type: "multiple-choice",
        subject: "mathematics",
        topic: "algebra",
        difficulty: "Medium",
        bloomTaxonomy: "apply",
        points: 10,
        questionText: "Q?",
        hint: "h",
        explanation: "e",
        body: {
          options: [
            { id: "A", text: "a", isCorrect: true },
            { id: "B", text: "b", isCorrect: false },
          ],
          correctOptionId: "A",
          allowMultiple: false,
        },
      },
    ];

    const fakeEngine = {
      generate: vi.fn(async (_params: GenerationParams) => ({
        questions,
        ragContext: null,
      })),
    };

    const orchestrator = new LearningOrchestrator(fakeEngine as unknown as QuestionEngine);

    const result = await orchestrator.generateQuestionSet({
      subject: "mathematics",
      count: 1,
    });

    expect(result.sources).toEqual([]);
  });
});
