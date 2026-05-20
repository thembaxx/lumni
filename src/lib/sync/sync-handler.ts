import { offlineDB } from "@/lib/db/schema";
import { enqueue } from "@/lib/orchestrator/job-queue";

export async function flushOfflineData(userId: string): Promise<void> {
	const allProgress = await offlineDB.progress.toArray();
	for (const p of allProgress) {
		if (p.odSubjectId && (p.questionsAttempted > 0 || p.correctCount > 0)) {
			await enqueue("appwrite-progress-sync", {
				userId,
				odSubjectId: p.odSubjectId,
				questionsAttempted: p.questionsAttempted,
				correctCount: p.correctCount,
				currentStreak: p.currentStreak,
				longestStreak: p.longestStreak,
			});
		}
		await offlineDB.progress.delete(p.id ?? 0);
	}

	const allAttempts = await offlineDB.quizAttempts.toArray();
	for (const a of allAttempts) {
		if (!a.userId) {
			await enqueue("appwrite-attempt-sync", {
				userId,
				subjectId: a.odSubject,
				score: a.score,
				totalQuestions: a.totalQuestions,
				duration: a.duration,
				completedAt: a.completedAt,
			});
			await offlineDB.quizAttempts.update(a.id ?? 0, { userId });
		}
	}
}
