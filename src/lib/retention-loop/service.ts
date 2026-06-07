import { dexieDataAccess } from "@/lib/db";
import type { SyncDataAccess } from "@/lib/db/data-access";
import type { RetentionRecurrence } from "@/lib/db/schema";
import { logError } from "@/lib/shared/logger";

const DEFAULT_COUNT = 3;

export class RetentionService {
	private db: SyncDataAccess;

	constructor(deps?: { db?: SyncDataAccess }) {
		this.db = deps?.db ?? dexieDataAccess;
	}

	async getRecurrenceCandidates(
		userId: string,
		count = DEFAULT_COUNT,
	): Promise<RetentionRecurrence[]> {
		if (typeof window === "undefined" || !("indexedDB" in window)) return [];
		try {
			const recentRecurrence = await this.db.retentionRecurrence
				.where("userId")
				.equals(userId)
				.filter((r) => !r.completed)
				.toArray();

			const recentQuestionIds = new Set(
				recentRecurrence.map((r) => r.questionId),
			);

			const wrongAnswers = await this.db.wrongAnswers
				.where("userId")
				.equals(userId)
				.filter((wa) => !recentQuestionIds.has(wa.questionId))
				.reverse()
				.limit(count * 3)
				.toArray();

			const candidates: RetentionRecurrence[] = [];
			const seenSubjects = new Map<string, number>();

			for (const wa of wrongAnswers) {
				if (candidates.length >= count) break;
				const subjectCount = seenSubjects.get(wa.subject) ?? 0;
				if (subjectCount >= 1) continue;
				seenSubjects.set(wa.subject, subjectCount + 1);

				candidates.push({
					questionId: wa.questionId,
					userId,
					subject: wa.subject,
					topic: wa.topic,
					questionText: wa.questionText,
					correctAnswer: wa.correctAnswer,
					explanation: wa.explanation,
					scheduledAt: Date.now(),
					completed: false,
				});
			}

			if (candidates.length > 0) {
				await this.db.retentionRecurrence.bulkAdd(candidates);
			}

			return candidates;
		} catch (err) {
			logError("GetRecurrenceCandidates", err);
			return [];
		}
	}

	async markRecurrence(
		questionId: string,
		userId: string,
		isCorrect: boolean,
	): Promise<void> {
		if (typeof window === "undefined" || !("indexedDB" in window)) return;
		try {
			const entry = await this.db.retentionRecurrence
				.where("questionId")
				.equals(questionId)
				.filter((r) => r.userId === userId && !r.completed)
				.first();
			if (entry?.id) {
				await this.db.retentionRecurrence.update(entry.id, {
					answeredAt: Date.now(),
					isCorrect,
					completed: true,
				});
			}
		} catch (err) {
			logError("MarkRecurrence", err);
		}
	}

	async getRecurrenceStats(userId: string): Promise<{
		totalScheduled: number;
		totalCompleted: number;
		totalCorrect: number;
		accuracy: number;
		pendingCount: number;
	}> {
		if (typeof window === "undefined" || !("indexedDB" in window)) {
			return {
				totalScheduled: 0,
				totalCompleted: 0,
				totalCorrect: 0,
				accuracy: 0,
				pendingCount: 0,
			};
		}
		try {
			const all = await this.db.retentionRecurrence
				.where("userId")
				.equals(userId)
				.toArray();
			const completed = all.filter((r) => r.completed);
			const correct = completed.filter((r) => r.isCorrect);
			return {
				totalScheduled: all.length,
				totalCompleted: completed.length,
				totalCorrect: correct.length,
				accuracy:
					completed.length > 0
						? Math.round((correct.length / completed.length) * 100)
						: 0,
				pendingCount: all.filter((r) => !r.completed).length,
			};
		} catch (err) {
			logError("GetRecurrenceStats", err);
			return {
				totalScheduled: 0,
				totalCompleted: 0,
				totalCorrect: 0,
				accuracy: 0,
				pendingCount: 0,
			};
		}
	}
}

export const retentionService = new RetentionService();
