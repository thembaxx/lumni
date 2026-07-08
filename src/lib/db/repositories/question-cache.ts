import { dexieDataAccess } from "@/lib/db/dexie-data-access";
import { safeJsonParse, safeJsonStringify } from "@/lib/shared/json";

export class QuestionCacheRepository {
  private get table() {
    return dexieDataAccess.questions;
  }

  async cache(subject: string, questions: unknown[], topic?: string): Promise<number> {
    const key = topic ? `${subject}-${topic}` : subject;
    const existing = await this.table.where("subject").equals(key).first();

    if (existing?.id != null) {
      return this.table.update(existing.id, {
        questions: safeJsonStringify(questions),
        cachedAt: Date.now(),
      });
    }

    return this.table.add({
      subject: key,
      topic,
      questions: safeJsonStringify(questions),
      cachedAt: Date.now(),
    });
  }

  async get(subject: string, topic?: string): Promise<unknown[] | undefined> {
    const key = topic ? `${subject}-${topic}` : subject;
    const cached = await this.table.where("subject").equals(key).first();

    if (!cached) return undefined;

    if (Date.now() - cached.cachedAt > 24 * 60 * 60 * 1000) {
      return undefined;
    }

    return safeJsonParse(cached.questions, []) as unknown[];
  }
}

export const questionCacheRepo = new QuestionCacheRepository();
