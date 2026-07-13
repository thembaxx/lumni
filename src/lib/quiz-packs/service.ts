import { nanoid } from "nanoid";
import { dexieDataAccess } from "@/lib/db";
import type { QuizDataAccess } from "@/lib/db/data-access";
import type { QuizPack, QuizPackQuestion } from "./types";
import { PACK_EXPIRY_DAYS } from "./types";

export class QuizPackService {
  private db: QuizDataAccess;

  constructor(deps?: { db?: QuizDataAccess }) {
    this.db = deps?.db ?? dexieDataAccess;
  }
  async generatePack(subject: string, topic: string | null, count: number): Promise<QuizPack> {
    const now = Date.now();
    const pack: QuizPack = {
      id: `pack_${nanoid(12)}`,
      subject,
      topic,
      title: `${subject}${topic ? ` - ${topic}` : ""} Pack`,
      questionCount: count,
      status: "generating",
      downloadProgress: 0,
      storageBytes: 0,
      createdAt: now,
      expiresAt: now + PACK_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
      lastUsedAt: null,
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
  }

  async touchPack(id: string): Promise<void> {
    await this.db.quizPacks.update(id, { lastUsedAt: Date.now() });
  }

  async getStorageUsage(): Promise<{ usedBytes: number; packCount: number }> {
    const packs = await this.db.quizPacks.toArray();
    const usedBytes = packs.reduce((sum, p) => sum + p.storageBytes, 0);
    return { usedBytes, packCount: packs.length };
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
