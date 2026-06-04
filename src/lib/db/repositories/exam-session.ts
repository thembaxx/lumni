import { dexieDataAccess } from "@/lib/db";
import { safeJsonStringify } from "@/lib/shared/json";
import type { ExamSessionSnapshot } from "../schema";

export async function saveExamSession(
	paperId: string,
	data: {
		answers: Record<string, { value: string | string[]; answeredAt: string }>;
		flags: string[];
		currentPartId: string | null;
		timeRemaining: number;
		startedAt: number;
		completed: boolean;
	},
): Promise<void> {
	const existing = await dexieDataAccess.examSessions
		.where("paperId")
		.equals(paperId)
		.first();

	const snapshot: Omit<ExamSessionSnapshot, "id"> = {
		paperId,
		answers: safeJsonStringify(data.answers),
		flags: safeJsonStringify(data.flags),
		currentPartId: data.currentPartId,
		timeRemaining: data.timeRemaining,
		startedAt: data.startedAt,
		lastSavedAt: Date.now(),
		completed: data.completed,
	};

	if (existing) {
		await dexieDataAccess.examSessions.update(existing.id ?? 0, snapshot);
	} else {
		await dexieDataAccess.examSessions.add(snapshot);
	}
}

export async function getExamSession(
	paperId: string,
): Promise<ExamSessionSnapshot | undefined> {
	return dexieDataAccess.examSessions.where("paperId").equals(paperId).first();
}

export async function clearExamSession(paperId: string): Promise<void> {
	await dexieDataAccess.examSessions.where("paperId").equals(paperId).delete();
}

export async function clearOldExamSessions(maxAgeHours = 24): Promise<void> {
	const cutoff = Date.now() - maxAgeHours * 60 * 60 * 1000;
	await dexieDataAccess.examSessions
		.where("lastSavedAt")
		.below(cutoff)
		.delete();
}
