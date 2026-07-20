import type { CacheResolver } from "@/lib/caching-strategy";
import { createCachingStrategy } from "@/lib/caching-strategy";
import { dexieDataAccess } from "@/lib/db/dexie-data-access";
import { safeJsonParse, safeJsonStringify } from "@/lib/shared/json";
import type { GenerateResult, GenerationParams, Question } from "./types";

async function _getCachedQuestions(
  subject: string,
  topic?: string,
): Promise<unknown[] | undefined> {
  const key = topic ? `${subject}-${topic}` : subject;
  const cached = await dexieDataAccess.questions.where("subject").equals(key).first();
  if (!cached) return undefined;
  if (Date.now() - cached.cachedAt > 24 * 60 * 60 * 1000) return undefined;
  return safeJsonParse(cached.questions, []) as unknown[];
}

async function _cacheQuestions(
  subject: string,
  questions: unknown[],
  topic?: string,
): Promise<number> {
  const key = topic ? `${subject}-${topic}` : subject;
  const existing = await dexieDataAccess.questions.where("subject").equals(key).first();
  if (existing?.id != null) {
    return dexieDataAccess.questions.update(existing.id, {
      questions: safeJsonStringify(questions),
      cachedAt: Date.now(),
    });
  }
  return dexieDataAccess.questions.add({
    subject: key,
    topic,
    questions: safeJsonStringify(questions),
    cachedAt: Date.now(),
  });
}

export function createQuestionCacheStrategy(
  generateInternal: (params: GenerationParams) => Promise<GenerateResult | null>,
): CacheResolver<GenerateResult, GenerationParams> {
  return createCachingStrategy<GenerateResult, GenerationParams>(
    [
      {
        name: "dexie",
        read: async (p) => {
          const cached = (await _getCachedQuestions(p.subject, p.topic)) as Question[];
          if (cached && cached.length >= p.count) {
            const shuffled = shuffleArray(cached);
            return { questions: shuffled.slice(0, p.count), ragContext: null };
          }
          return null;
        },
        write: async (params, result) => {
          await _cacheQuestions(params.subject, result.questions, params.topic);
        },
      },
      {
        name: "appwrite",
        read: async (p) => {
          const { loadQuestionsFromAppwrite } = await import("./persistence");
          const appwriteQuestions = (await loadQuestionsFromAppwrite(
            p.subject,
            p.topic,
            p.count,
          )) as Question[];
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
