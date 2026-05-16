import { offlineDB } from "@/lib/db/offline";
import { safePersist } from "@/lib/db/persist";
import type { BloomLevel } from "@/lib/question-engine/types";
import {
	type CompetencyLevel,
	type CompetencyRecord,
	computeCompetencyLevel,
	computeWeightedScore,
} from "./types";

export class CompetencyService {
	async update(
		subjectId: string,
		topicId: string,
		bloomLevel: BloomLevel,
		questionScore: number,
		weight: number,
	): Promise<void> {
		await safePersist(
			"competency update",
			async () => {
				const existing = await offlineDB.competencies
					.where({ subjectId, topicId, bloomLevel })
					.first();

				const newScore = existing
					? computeWeightedScore(
							existing.score,
							existing.attempts,
							questionScore,
							weight,
						)
					: questionScore;

				const newAttempts = (existing?.attempts ?? 0) + 1;
				const level = computeCompetencyLevel(newScore);
				const now = Date.now();

				if (existing?.id) {
					await offlineDB.competencies.update(existing.id, {
						score: newScore,
						attempts: newAttempts,
						lastAssessed: now,
						level,
					});
				} else {
					await offlineDB.competencies.add({
						subjectId,
						topicId,
						bloomLevel,
						score: newScore,
						attempts: newAttempts,
						lastAssessed: now,
						level,
					});
				}

				return { newScore, newAttempts, now, level } as const;
			},
			async (result) => {
				const { addToSyncQueue } = await import("@/lib/db/offline");
				await addToSyncQueue("sync", {
					type: "competency",
					subjectId,
					topicId,
					bloomLevel,
					score: result.newScore,
					attempts: result.newAttempts,
					lastAssessed: result.now,
					level: result.level,
				});
			},
		);
	}

	async getCompetencies(subjectId: string): Promise<CompetencyRecord[]> {
		try {
			return offlineDB.competencies
				.where("subjectId")
				.equals(subjectId)
				.toArray();
		} catch {
			return [];
		}
	}

	async getCompetency(
		subjectId: string,
		topicId: string,
		bloomLevel: BloomLevel,
	): Promise<CompetencyRecord | null> {
		try {
			return (
				(await offlineDB.competencies
					.where({ subjectId, topicId, bloomLevel })
					.first()) ?? null
			);
		} catch {
			return null;
		}
	}

	async getMasterySummary(subjectId: string): Promise<{
		total: number;
		novice: number;
		developing: number;
		proficient: number;
		mastered: number;
		averageScore: number;
	}> {
		const records = await this.getCompetencies(subjectId);
		const count = (level: CompetencyLevel) =>
			records.filter((r) => r.level === level).length;
		const avg =
			records.length > 0
				? records.reduce((s, r) => s + r.score, 0) / records.length
				: 0;

		return {
			total: records.length,
			novice: count("novice"),
			developing: count("developing"),
			proficient: count("proficient"),
			mastered: count("mastered"),
			averageScore: Math.round(avg * 100) / 100,
		};
	}

	async getCompetencyLevel(
		subjectId: string,
		topicId: string,
	): Promise<CompetencyLevel | null> {
		const all = await this.getCompetencies(subjectId);
		const topicRecords = all.filter((r) => r.topicId === topicId);
		if (topicRecords.length === 0) return null;
		const avgScore =
			topicRecords.reduce((s, r) => s + r.score, 0) / topicRecords.length;
		return computeCompetencyLevel(avgScore);
	}
}

export const competencyService = new CompetencyService();
