import { addToSyncQueue, saveProgress } from "@/lib/db/offline";

export class ProgressService {
	async update(
		subject: string,
		result: { correct: boolean; score: number },
	): Promise<void> {
		try {
			const existing = await import("@/lib/db/offline").then((m) =>
				m.getProgress(subject),
			);

			await saveProgress(subject, {
				questionsAttempted: (existing?.questionsAttempted ?? 0) + 1,
				correctCount: (existing?.correctCount ?? 0) + (result.correct ? 1 : 0),
				currentStreak: result.correct ? (existing?.currentStreak ?? 0) + 1 : 0,
				longestStreak: Math.max(
					existing?.longestStreak ?? 0,
					result.correct ? (existing?.currentStreak ?? 0) + 1 : 0,
				),
			});

			await addToSyncQueue("updateProgress", {
				odSubjectId: subject,
				questionsAttempted: (existing?.questionsAttempted ?? 0) + 1,
				correctCount: (existing?.correctCount ?? 0) + (result.correct ? 1 : 0),
			}).catch(() => {});
		} catch {
			/* progress update is non-critical */
		}
	}
}

export const progressService = new ProgressService();
