import { dexieDataAccess } from "@/lib/db";
import type { DataAccess } from "@/lib/db/data-access";
import { safeJsonStringify } from "@/lib/shared/json";
import type { ExamSessionSnapshot } from "../schema";

export class ExamSessionRepository {
	constructor(private db: DataAccess) {}

	async save(
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
		const existing = await this.db.examSessions
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
			await this.db.examSessions.update(existing.id ?? 0, snapshot);
		} else {
			await this.db.examSessions.add(snapshot);
		}
	}

	async get(paperId: string): Promise<ExamSessionSnapshot | undefined> {
		return this.db.examSessions.where("paperId").equals(paperId).first();
	}

	async clear(paperId: string): Promise<void> {
		await this.db.examSessions.where("paperId").equals(paperId).delete();
	}

	async clearOld(maxAgeHours = 24): Promise<void> {
		const cutoff = Date.now() - maxAgeHours * 60 * 60 * 1000;
		await this.db.examSessions.where("lastSavedAt").below(cutoff).delete();
	}
}

export const examSessionRepo = new ExamSessionRepository(dexieDataAccess);
