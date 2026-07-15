import type { GenerationParams, Question, QuestionType } from "./types";
import type { RagContext } from "./prompt-manager";
import { logError } from "@/lib/shared/logger";
import type { ProcessorRegistry } from "./processor-registry";

export async function generateBatch(
  registry: ProcessorRegistry,
  enriched: GenerationParams,
  ragContext: RagContext,
  count: number,
): Promise<Question[]> {
  if (!enriched.questionType || enriched.questionType === "any") {
    return generateMixed(registry, enriched, ragContext);
  }
  const types = Array.isArray(enriched.questionType)
    ? enriched.questionType
    : [enriched.questionType];
  const perTypeCount = Math.ceil(count / types.length);
  const typeResults = await Promise.all(
    types.map(async (type) => {
      try {
        const processor = registry.getProcessor(type);
        const typeParams = {
          ...enriched,
          count: perTypeCount,
          questionType: type,
        };
        return await processor.generate(typeParams, ragContext);
      } catch (error) {
        logError("QuestionEngine.generateBatch", error);
        return [];
      }
    }),
  );
  return typeResults.flat();
}

async function generateMixed(
  registry: ProcessorRegistry,
  params: GenerationParams,
  ragContext: RagContext,
): Promise<Question[]> {
  const batches: QuestionType[][] = [
    ["multiple-choice", "matching", "match-pairs"],
    ["short-answer", "long-answer", "essay"],
    ["calculation", "diagram", "ordering"],
    ["fill-in-sequence", "diagram-labelling", "hot-spot"],
    ["source-based", "data-response"],
    ["programming"],
    ["mixed"],
  ];

  const { count } = params;

  const results: Question[] = [];

  for (const batch of batches) {
    const remaining = count - results.length;
    if (remaining <= 0) break;

    const available = batch.filter((t) => registry.hasProcessor(t));
    if (available.length === 0) {
      continue;
    }

    const batchItemCount = Math.max(1, Math.ceil(remaining / available.length));
    const perType = Math.floor(batchItemCount / available.length);
    const remainder = batchItemCount - perType * available.length;

    for (let i = 0; i < available.length; i++) {
      const needed = perType + (i < remainder ? 1 : 0);
      if (needed <= 0) {
        continue;
      }

      let generated = false;
      for (let j = 0; j < available.length && !generated; j++) {
        const tryType = available[(i + j) % available.length];
        const processor = registry.getProcessor(tryType);
        try {
          const questions = await processor.generate(
            { ...params, count: needed, questionType: tryType },
            ragContext,
          );
          if (questions.length > 0) {
            results.push(...questions);
            generated = true;
          }
        } catch (error) {
          logError("QuestionEngine.generateMixed", error);
        }
      }
    }
  }

  return results.slice(0, count);
}
