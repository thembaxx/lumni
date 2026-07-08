import { dexieDataAccess } from "@/lib/db/dexie-data-access";
import type { CachedProgress } from "../schema";

export class ProgressRepository {
  private get db() {
    return dexieDataAccess.progress;
  }

  async save(
    odSubjectId: string,
    data: {
      questionsAttempted: number;
      correctCount: number;
      currentStreak: number;
      longestStreak: number;
    },
    userId?: string,
  ): Promise<number> {
    const existing = await this.db.where("odSubjectId").equals(odSubjectId).first();

    if (existing?.id != null) {
      return this.db.update(existing.id, {
        ...data,
        updatedAt: Date.now(),
      });
    }

    return this.db.add({
      odSubjectId,
      userId,
      ...data,
      updatedAt: Date.now(),
    });
  }

  async get(odSubjectId: string, userId?: string): Promise<CachedProgress | undefined> {
    const item = await this.db.where("odSubjectId").equals(odSubjectId).first();
    if (!item) return undefined;
    if (userId && item.userId && item.userId !== userId) return undefined;
    return item;
  }
}

export const progressRepo = new ProgressRepository();
