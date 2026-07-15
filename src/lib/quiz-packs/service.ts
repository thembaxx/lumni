import { nanoid } from "nanoid";
import { dexieDataAccess } from "@/lib/db";
import type { QuizDataAccess } from "@/lib/db/data-access";
import type { QuizPack, QuizPackQuestion, QuizPackVisualAsset } from "./types";
import { PACK_EXPIRY_DAYS, MAX_PACK_STORAGE_BYTES } from "./types";

export class QuizPackService {
  private db: QuizDataAccess;

  constructor(deps?: { db?: QuizDataAccess }) {
    this.db = deps?.db ?? dexieDataAccess;
  }

  async generatePack(subject: string, topic: string | null, count: number): Promise<QuizPack> {
    const now = Date.now();
    const clampedCount = Math.min(count, 100);
    const pack: QuizPack = {
      id: `pack_${nanoid(12)}`,
      subject,
      topic,
      title: `${subject}${topic ? ` - ${topic}` : ""} Pack`,
      questionCount: clampedCount,
      status: "generating",
      downloadProgress: 0,
      storageBytes: 0,
      createdAt: now,
      expiresAt: now + PACK_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
      lastUsedAt: null,
      visualAssetsGenerated: false,
      visualAssetsCount: 0,
    };

    await this.db.quizPacks.add(pack);
    return pack;
  }

  async markReady(id: string, storageBytes: number): Promise<void> {
    await this.db.quizPacks.update(id, {
      status: "ready",
      downloadProgress: 100,
      storageBytes,
    });
  }

  async markVisualAssetsReady(id: string, assetCount: number, additionalBytes: number): Promise<void> {
    const pack = await this.db.quizPacks.get(id);
    const totalBytes = (pack?.storageBytes ?? 0) + additionalBytes;
    await this.db.quizPacks.update(id, {
      visualAssetsGenerated: true,
      visualAssetsCount: assetCount,
      storageBytes: totalBytes,
    });
  }

  async markFailed(id: string): Promise<void> {
    await this.db.quizPacks.update(id, { status: "failed" });
  }

  async updateProgress(id: string, progress: number): Promise<void> {
    await this.db.quizPacks.update(id, {
      downloadProgress: Math.min(progress, 100),
    });
  }

  async getPacks(): Promise<QuizPack[]> {
    const packs = await this.db.quizPacks.orderBy("createdAt").toReversed().toArray();
    const now = Date.now();
    const updated = await Promise.all(
      packs.map(async (pack: QuizPack) => this.expirePackIfNeeded(pack, now)),
    );
    return updated;
  }

  async getPack(id: string): Promise<QuizPack | undefined> {
    return this.db.quizPacks.get(id);
  }

  async deletePack(id: string): Promise<void> {
    await this.db.quizPacks.delete(id);
    await this.db.packQuestions.where("packId").equals(id).delete();
    await this.db.packVisualAssets.where("packId").equals(id).delete();
  }

  async touchPack(id: string): Promise<void> {
    await this.db.quizPacks.update(id, { lastUsedAt: Date.now() });
  }

  async getStorageUsage(): Promise<{ usedBytes: number; packCount: number; quotaBytes: number }> {
    const packs = await this.db.quizPacks.toArray();
    const usedBytes = packs.reduce((sum, p) => sum + p.storageBytes, 0);
    return { usedBytes, packCount: packs.length, quotaBytes: MAX_PACK_STORAGE_BYTES };
  }

  async getQuestions(packId: string): Promise<QuizPackQuestion[]> {
    return this.db.packQuestions.where("packId").equals(packId).sortBy("questionIndex");
  }

  async storeQuestions(
    packId: string,
    questions: Omit<QuizPackQuestion, "packId">[],
  ): Promise<void> {
    await this.db.packQuestions.bulkAdd(questions.map((q) => ({ ...q, packId })));
  }

  async storeVisualAssets(
    packId: string,
    assets: Omit<QuizPackVisualAsset, "packId" | "createdAt">[],
  ): Promise<number> {
    const now = Date.now();
    const bytes = assets.reduce((sum, a) => sum + a.assetData.length, 0);
    await this.db.packVisualAssets.bulkAdd(assets.map((a) => ({ ...a, packId, createdAt: now })));
    return bytes;
  }

  async getVisualAsset(packId: string, questionIndex: number): Promise<QuizPackVisualAsset | undefined> {
    return this.db.packVisualAssets
      .where("[packId+questionIndex]")
      .equals([packId, questionIndex])
      .first();
  }

  async getAllVisualAssets(packId: string): Promise<QuizPackVisualAsset[]> {
    return this.db.packVisualAssets.where("packId").equals(packId).toArray();
  }

  async evictOldestPack(): Promise<string | null> {
    const packs = await this.db.quizPacks
      .where("status")
      .equals("ready")
      .filter((p) => p.lastUsedAt !== null)
      .sortBy("lastUsedAt");

    if (packs.length === 0) return null;

    const oldest = packs[0];
    await this.deletePack(oldest.id);
    return oldest.id;
  }

  async ensureQuota(): Promise<void> {
    const { usedBytes } = await this.getStorageUsage();
    if (usedBytes <= MAX_PACK_STORAGE_BYTES) return;

    while (true) {
      const { usedBytes: currentUsed } = await this.getStorageUsage();
      if (currentUsed <= MAX_PACK_STORAGE_BYTES) break;
      const evicted = await this.evictOldestPack();
      if (!evicted) break;
    }
  }

  async cleanupExpired(): Promise<number> {
    const now = Date.now();
    const expired = await this.db.quizPacks.where("expiresAt").below(now).toArray();
    await Promise.all(expired.map((pack) => this.deletePack(pack.id)));
    return expired.length;
  }

  private async expirePackIfNeeded(pack: QuizPack, now: number): Promise<QuizPack> {
    if (pack.status === "ready" && pack.expiresAt < now) {
      await this.db.quizPacks.update(pack.id, {
        status: "expired",
      });
      return { ...pack, status: "expired" as const };
    }
    return pack;
  }
}

export const quizPackService = new QuizPackService();