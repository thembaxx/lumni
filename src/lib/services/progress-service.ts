import { saveProgress } from "@/lib/db/offline";
import { safePersist } from "@/lib/db/persist";

export class ProgressService {
	async update(
		subject: string,
		result: { correct: boolean; score: number },
	): Promise<void> {
		await safePersist(
			"progress update",
			async () => {
				const existing = await import("@/lib/db/offline").then((m) =>
					m.getProgress(subject),
				);

				await saveProgress(subject, {
					questionsAttempted: (existing?.questionsAttempted ?? 0) + 1,
					correctCount:
						(existing?.correctCount ?? 0) + (result.correct ? 1 : 0),
					currentStreak: result.correct
						? (existing?.currentStreak ?? 0) + 1
						: 0,
					longestStreak: Math.max(
						existing?.longestStreak ?? 0,
						result.correct ? (existing?.currentStreak ?? 0) + 1 : 0,
					),
				});

				return existing;
			},
			async (existing) => {
				const { addToSyncQueue } = await import("@/lib/db/offline");
				await addToSyncQueue("updateProgress", {
					odSubjectId: subject,
					questionsAttempted: (existing?.questionsAttempted ?? 0) + 1,
					correctCount:
						(existing?.correctCount ?? 0) + (result.correct ? 1 : 0),
				});
			},
		);
	}
}

export const progressService = new ProgressService();
