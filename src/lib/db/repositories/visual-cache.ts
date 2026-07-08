import { dexieDataAccess } from "@/lib/db/dexie-data-access";
import type { CachedVisual } from "@/lib/db/schema";
import { safeJsonStringify, safeJsonParse } from "@/lib/shared/json";
import type { VisualContent } from "@/lib/visual-engine/types";

export function makeCacheKey(questionId: string, subject: string): string {
  return `${subject}:${questionId}`;
}

export class VisualCacheRepository {
  private get db() {
    return dexieDataAccess.visuals;
  }

  async cacheVisual(
    cacheKey: string,
    subject: string,
    visual: VisualContent | null,
  ): Promise<void> {
    const existing = await this.db.where("cacheKey").equals(cacheKey).first();
    const entry: CachedVisual = {
      cacheKey,
      subject,
      visual: safeJsonStringify(visual),
      createdAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    };
    if (existing?.id != null) {
      await this.db.update(existing.id, entry);
    } else {
      await this.db.add(entry);
    }
  }

  async getVisual(cacheKey: string): Promise<VisualContent | null> {
    const entry = await this.db.where("cacheKey").equals(cacheKey).first();
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      if (entry.id != null) await this.db.delete(entry.id);
      return null;
    }
    return safeJsonParse<VisualContent>(entry.visual, null);
  }
}

export const visualCacheRepo = new VisualCacheRepository();
