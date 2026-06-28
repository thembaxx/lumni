import { describe, expect, test } from "vitest";
import { QuestionEngine } from "../question-engine";
import type { EnrichmentPipeline } from "../enrichment-pipeline";
import type { GenerationParams } from "../types";

function makeMockEnrichment(poolCount: number, setPastPaperMode = false): EnrichmentPipeline {
  const poolQuestions = Array.from({ length: poolCount }, (_, i) => ({
    id: `pq_${i + 1}`,
    questionText: `Pool question ${i + 1}`,
    answerText: `Answer ${i + 1}`,
    marks: 2,
    year: 2023,
    paperNumber: 1,
    similarity: 0.85,
    type: "short-answer" as const,
    bloomLevel: "remember" as const,
  }));

  return {
    async enrich(params: GenerationParams): Promise<GenerationParams> {
      return {
        ...params,
        ...(setPastPaperMode ? { pastPaperMode: true } : {}),
        ...(poolQuestions.length > 0 ? { poolQuestions } : {}),
      };
    },
  };
}

describe("adaptive pool", () => {
  test("pool with enough questions returns only pool questions", async () => {
    const engine = new QuestionEngine(undefined, undefined, undefined, makeMockEnrichment(5));
    const result = await engine.generate({ subject: "mathematics", count: 5 });
    expect(result.questions).toHaveLength(5);
    for (const q of result.questions) {
      expect(q.metadata?.source).toBe("imported");
      expect(q.sourcePastPaperQuestionId).toMatch(/^pq_/);
    }
  });

  test("pool with insufficient questions includes pool questions in result", async () => {
    const engine = new QuestionEngine(undefined, undefined, undefined, makeMockEnrichment(2));
    const result = await engine.generate({ subject: "mathematics", count: 5 });
    const poolQuestions = result.questions.filter((q) => q.metadata?.source === "imported");
    expect(poolQuestions).toHaveLength(2);
  });

  test("pastPaperMode=true with insufficient pool returns only pool questions (no AI)", async () => {
    const engine = new QuestionEngine(undefined, undefined, undefined, makeMockEnrichment(2, true));
    const result = await engine.generate({
      subject: "mathematics",
      count: 5,
      pastPaperMode: true,
    });
    expect(result.questions).toHaveLength(2);
    for (const q of result.questions) {
      expect(q.metadata?.source).toBe("imported");
    }
  });

  test("pastPaperMode=true with empty pool returns empty", async () => {
    const engine = new QuestionEngine(undefined, undefined, undefined, makeMockEnrichment(0, true));
    const result = await engine.generate({
      subject: "mathematics",
      count: 5,
      pastPaperMode: true,
    });
    expect(result.questions).toHaveLength(0);
  });

  test("pastPaperMode=false with empty pool returns empty (no AI available in test)", async () => {
    const engine = new QuestionEngine(undefined, undefined, undefined, makeMockEnrichment(0));
    const result = await engine.generate({ subject: "mathematics", count: 5 });
    expect(result.questions).toHaveLength(0);
  });
});
