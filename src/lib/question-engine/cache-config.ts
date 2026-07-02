import type { CacheResolver } from "@/lib/caching-strategy";
import { createCachingStrategy } from "@/lib/caching-strategy";
import type { GenerateResult, GenerationParams, Question } from "./types";

export function createQuestionCacheStrategy(
  generateInternal: (params: GenerationParams) => Promise<GenerateResult | null>,
): CacheResolver<GenerateResult, GenerationParams> {
  return createCachingStrategy<GenerateResult, GenerationParams>(
    [
      {
        name: "dexie",
        read: async (p) => {
          const { questionCacheRepo: qRepo } =
            await import("@/lib/db/repositories/question-cache");
          const cached = await qRepo.get(p.subject, p.topic) as Question[];
          if (cached && cached.length >= p.count) {
            const shuffled = shuffleArray(cached);
            return { questions: shuffled.slice(0, p.count), ragContext: null };
          }
          return null;
        },
        write: async (params, result) => {
          const { questionCacheRepo: qRepo } =
            await import("@/lib/db/repositories/question-cache");
          await qRepo.cache(params.subject, result.questions, params.topic);
        },
      },
      {
        name: "appwrite",
        read: async (p) => {
          const { loadQuestionsFromAppwrite } = await import("./persistence");
          const appwriteQuestions = await loadQuestionsFromAppwrite(
            p.subject,
            p.topic,
            p.count,
          ) as Question[];
          if (appwriteQuestions.length >= p.count) {
            const shuffled = shuffleArray(appwriteQuestions);
            return { questions: shuffled.slice(0, p.count), ragContext: null };
          }
          return null;
        },
        write: async () => {},
      },
    ],
    generateInternal,
  );
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
