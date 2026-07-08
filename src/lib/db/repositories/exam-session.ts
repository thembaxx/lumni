import { dexieDataAccess } from "@/lib/db/dexie-data-access";
import type { ExamSessionSnapshot } from "@/lib/db/schema";
import { safeJsonStringify } from "@/lib/shared/json";

export class ExamSessionRepository {
  private get db() {
    return dexieDataAccess.examSessions;
  }

  async save(
    paperId: string,
    data: {
      answers: Record<string, unknown> | string;
      flags: unknown[] | string;
      currentPartId: string | null;
      timeRemaining: number;
      startedAt: number;
      completed: boolean;
    },
  ): Promise<void> {
    const existing = await this.db.where("paperId").equals(paperId).first();
    const record: ExamSessionSnapshot = {
      paperId,
      answers: typeof data.answers === "string" ? data.answers : safeJsonStringify(data.answers),
      flags: typeof data.flags === "string" ? data.flags : safeJsonStringify(data.flags),
      currentPartId: data.currentPartId,
      timeRemaining: data.timeRemaining,
      startedAt: data.startedAt,
      completed: data.completed,
      lastSavedAt: Date.now(),
    };
    if (existing?.id != null) {
      await this.db.update(existing.id, record);
    } else {
      await this.db.add(record);
    }
  }

  async get(paperId: string): Promise<ExamSessionSnapshot | undefined> {
    return this.db.where("paperId").equals(paperId).first();
  }

  async clear(paperId: string): Promise<void> {
    await this.db.where("paperId").equals(paperId).delete();
  }

  async clearOld(maxAgeHours: number): Promise<void> {
    const cutoff = Date.now() - maxAgeHours * 60 * 60 * 1000;
    const all = await this.db.toArray();
    const old = all.filter((s) => s.lastSavedAt < cutoff);
    await Promise.all(old.map((s) => s.id != null && this.db.delete(s.id)));
  }
}

export const examSessionRepo = new ExamSessionRepository();
