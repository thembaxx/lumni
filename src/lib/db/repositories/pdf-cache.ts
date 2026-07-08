import { dexieDataAccess } from "@/lib/db/dexie-data-access";
import type { CachedPdf } from "@/lib/db/schema";

export class PdfCacheRepository {
  private get db() {
    return dexieDataAccess.cachedPdfs;
  }

  async cache(paperId: string, pdfData: Blob, fileName: string): Promise<void> {
    const existing = await this.db.where("paperId").equals(paperId).first();
    const entry: CachedPdf = { paperId, pdfData, fileName, cachedAt: Date.now() };
    if (existing?.id != null) {
      await this.db.update(existing.id, entry);
    } else {
      await this.db.add(entry);
    }
  }

  async get(paperId: string): Promise<CachedPdf | undefined> {
    return this.db.where("paperId").equals(paperId).first();
  }

  async isCached(paperId: string): Promise<boolean> {
    const entry = await this.get(paperId);
    return !!entry;
  }

  async getUrl(paperId: string): Promise<string | null> {
    const entry = await this.get(paperId);
    if (!entry) return null;
    return URL.createObjectURL(entry.pdfData);
  }

  async remove(paperId: string): Promise<void> {
    await this.db.where("paperId").equals(paperId).delete();
  }

  async clearOld(maxAgeHours: number): Promise<void> {
    const cutoff = Date.now() - maxAgeHours * 60 * 60 * 1000;
    const all = await this.db.toArray();
    const old = all.filter((e) => e.cachedAt < cutoff);
    await Promise.all(old.map((e) => e.id != null && this.db.delete(e.id)));
  }
}

export const pdfCacheRepo = new PdfCacheRepository();
