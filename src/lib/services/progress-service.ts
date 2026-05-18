import { getProgress, saveProgress } from "@/lib/db/repositories/progress";
import { enqueue } from "@/lib/orchestrator/job-queue";

export class ProgressService {
	async update(
		subject: string,
		result: { correct: boolean; score: number },
	): Promise<void> {
		const existing = await getProgress(subject);

		await saveProgress(subject, {
			questionsAttempted: (existing?.questionsAttempted ?? 0) + 1,
			correctCount: (existing?.correctCount ?? 0) + (result.correct ? 1 : 0),
			currentStreak: result.correct ? (existing?.currentStreak ?? 0) + 1 : 0,
			longestStreak: Math.max(
				existing?.longestStreak ?? 0,
				result.correct ? (existing?.currentStreak ?? 0) + 1 : 0,
			),
		});

		await enqueue("appwrite-progress-sync", {
			odSubjectId: subject,
			userId: "",
			questionsAttempted: (existing?.questionsAttempted ?? 0) + 1,
			correctCount: (existing?.correctCount ?? 0) + (result.correct ? 1 : 0),
			currentStreak: result.correct ? (existing?.currentStreak ?? 0) + 1 : 0,
			longestStreak: Math.max(
				existing?.longestStreak ?? 0,
				result.correct ? (existing?.currentStreak ?? 0) + 1 : 0,
			),
		});
	}
}

export const progressService = new ProgressService();
