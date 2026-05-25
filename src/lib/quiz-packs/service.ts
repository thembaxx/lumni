import { nanoid } from "nanoid";
import { offlineDB } from "@/lib/db/schema";
import type { QuizPack, QuizPackQuestion } from "./types";
import { PACK_EXPIRY_DAYS } from "./types";

export class QuizPackService {
	async generatePack(
		subject: string,
		topic: string | null,
		count: number,
	): Promise<QuizPack> {
		const pack: QuizPack = {
			id: `pack_${nanoid(12)}`,
			subject,
			topic,
			title: `${subject}${topic ? ` - ${topic}` : ""} Pack`,
			questionCount: count,
			status: "generating",
			downloadProgress: 0,
			storageBytes: 0,
			createdAt: Date.now(),
			expiresAt: Date.now() + PACK_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
			lastUsedAt: null,
		};

		await offlineDB.quizPacks.add(pack);
		return pack;
	}

	async markReady(id: string, storageBytes: number): Promise<void> {
		await offlineDB.quizPacks.update(id, {
			status: "ready",
			downloadProgress: 100,
			storageBytes,
		});
	}

	async markFailed(id: string): Promise<void> {
		await offlineDB.quizPacks.update(id, { status: "failed" });
	}

	async updateProgress(id: string, progress: number): Promise<void> {
		await offlineDB.quizPacks.update(id, {
			downloadProgress: Math.min(progress, 100),
		});
	}

	async getPacks(): Promise<QuizPack[]> {
		const packs = await offlineDB.quizPacks
			.orderBy("createdAt")
			.reverse()
			.toArray();
		const now = Date.now();
		const updated: QuizPack[] = [];
		for (const pack of packs) {
			if (pack.status === "ready" && pack.expiresAt < now) {
				await offlineDB.quizPacks.update(pack.id, {
					status: "expired",
				});
				updated.push({ ...pack, status: "expired" });
			} else {
				updated.push(pack);
			}
		}
		return updated;
	}

	async getPack(id: string): Promise<QuizPack | undefined> {
		return offlineDB.quizPacks.get(id);
	}

	async deletePack(id: string): Promise<void> {
		await offlineDB.quizPacks.delete(id);
		await offlineDB.packQuestions.where("packId").equals(id).delete();
	}

	async touchPack(id: string): Promise<void> {
		await offlineDB.quizPacks.update(id, { lastUsedAt: Date.now() });
	}

	async getStorageUsage(): Promise<{ usedBytes: number; packCount: number }> {
		const packs = await offlineDB.quizPacks.toArray();
		const usedBytes = packs.reduce((sum, p) => sum + p.storageBytes, 0);
		return { usedBytes, packCount: packs.length };
	}

	async getQuestions(packId: string): Promise<QuizPackQuestion[]> {
		return offlineDB.packQuestions
			.where("packId")
			.equals(packId)
			.sortBy("questionIndex");
	}

	async storeQuestions(
		packId: string,
		questions: Omit<QuizPackQuestion, "packId">[],
	): Promise<void> {
		await offlineDB.packQuestions.bulkAdd(
			questions.map((q) => ({ ...q, packId })),
		);
	}

	async cleanupExpired(): Promise<number> {
		const now = Date.now();
		const expired = await offlineDB.quizPacks
			.where("expiresAt")
			.below(now)
			.toArray();
		for (const pack of expired) {
			await this.deletePack(pack.id);
		}
		return expired.length;
	}
}

export const quizPackService = new QuizPackService();
