import { dexieDataAccess } from "@/lib/db";
import type { CachedProgress } from "../schema";

export async function saveProgress(
	odSubjectId: string,
	data: {
		questionsAttempted: number;
		correctCount: number;
		currentStreak: number;
		longestStreak: number;
	},
	userId?: string,
): Promise<number> {
	const existing = await dexieDataAccess.progress
		.where("odSubjectId")
		.equals(odSubjectId)
		.first();

	if (existing) {
		return dexieDataAccess.progress.update(existing.id ?? 0, {
			...data,
			updatedAt: Date.now(),
		});
	}

	return dexieDataAccess.progress.add({
		odSubjectId,
		userId,
		...data,
		updatedAt: Date.now(),
	});
}

export async function getProgress(
	odSubjectId: string,
	userId?: string,
): Promise<CachedProgress | undefined> {
	const query = dexieDataAccess.progress
		.where("odSubjectId")
		.equals(odSubjectId);
	const item = await query.first();
	if (!item) return undefined;
	if (userId && item.userId && item.userId !== userId) return undefined;
	return item;
}
