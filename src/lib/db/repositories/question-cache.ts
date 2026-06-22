import { dexieDataAccess } from "@/lib/db";
import type { DataAccess } from "@/lib/db/data-access";
import { safeJsonParse, safeJsonStringify } from "@/lib/shared/json";

export class QuestionCacheRepository {
  constructor(private db: DataAccess | undefined) {}

  private get table() {
    return this.db?.questions;
  }

  async cache(subject: string, questions: unknown[], topic?: string): Promise<number> {
    const table = this.table;
    if (!table) return 0;
    const key = topic ? `${subject}-${topic}` : subject;
    const existing = await table.where("subject").equals(key).first();

    if (existing) {
      return table.update(existing.id ?? 0, {
        questions: safeJsonStringify(questions),
        cachedAt: Date.now(),
      });
    }

    return table.add({
      subject: key,
      topic,
      questions: safeJsonStringify(questions),
      cachedAt: Date.now(),
    });
  }

  async get(subject: string, topic?: string): Promise<unknown[] | undefined> {
    const table = this.table;
    if (!table) return undefined;
    const key = topic ? `${subject}-${topic}` : subject;
    const cached = await table.where("subject").equals(key).first();

    if (!cached) return undefined;

    if (Date.now() - cached.cachedAt > 24 * 60 * 60 * 1000) {
      return undefined;
    }

    return safeJsonParse(cached.questions, []) as unknown[];
  }
}

export function createQuestionCacheRepository(db: DataAccess = dexieDataAccess) {
  return new QuestionCacheRepository(db);
}
export const questionCacheRepo = createQuestionCacheRepository();
