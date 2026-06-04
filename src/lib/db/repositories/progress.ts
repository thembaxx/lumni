import { dexieDataAccess } from "@/lib/db";
import type { DataAccess } from "@/lib/db/data-access";
import type { CachedProgress } from "../schema";

export class ProgressRepository {
	constructor(private db: DataAccess) {}

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
		const existing = await this.db.progress
			.where("odSubjectId")
			.equals(odSubjectId)
			.first();

		if (existing) {
			return this.db.progress.update(existing.id ?? 0, {
				...data,
				updatedAt: Date.now(),
			});
		}

		return this.db.progress.add({
			odSubjectId,
			userId,
			...data,
			updatedAt: Date.now(),
		});
	}

	async get(
		odSubjectId: string,
		userId?: string,
	): Promise<CachedProgress | undefined> {
		const item = await this.db.progress
			.where("odSubjectId")
			.equals(odSubjectId)
			.first();
		if (!item) return undefined;
		if (userId && item.userId && item.userId !== userId) return undefined;
		return item;
	}
}

export const progressRepo = new ProgressRepository(dexieDataAccess);
