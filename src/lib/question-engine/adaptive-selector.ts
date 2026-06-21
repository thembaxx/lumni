import type { CompetencyRecord } from "@/lib/competency-engine/types";
import type { DataAccess } from "@/lib/db/data-access";
import type { ScoredPoolQuestion } from "@/lib/embedding/types";
import { logError } from "@/lib/shared/logger";

interface AdaptiveScore {
	question: ScoredPoolQuestion;
	score: number;
}

function computeCompetencyWeight(
	question: ScoredPoolQuestion,
	competencies: CompetencyRecord[],
): number {
	const topic = question.topic ?? question.subtopicId;
	if (!topic) return 1;

	const topicRecords = competencies.filter((c) => c.topicId === topic);
	if (topicRecords.length === 0) return 1.5;

	const avgScore =
		topicRecords.reduce((s, r) => s + r.score, 0) / topicRecords.length;

	if (avgScore < 30) return 2.0;
	if (avgScore < 50) return 1.5;
	if (avgScore < 70) return 1.2;
	return 0.8;
}

function computeFreshnessWeight(
	questionId: string,
	seenIds: Set<string>,
): number {
	return seenIds.has(questionId) ? 0.3 : 1.0;
}

export async function selectAdaptiveQuestions(
	allScored: ScoredPoolQuestion[],
	subject: string,
	count: number,
	deps: { db: DataAccess },
): Promise<ScoredPoolQuestion[]> {
	try {
		const [competencies, seenRecords] = await Promise.all([
			deps.db.competencies.where("subjectId").equals(subject).toArray(),
			deps.db.seenPastPaperQuestions.where("subject").equals(subject).toArray(),
		]);

		const seenIds = new Set(seenRecords.map((r) => r.questionId));

		const scored: AdaptiveScore[] = allScored.map((q) => {
			const competencyWeight = computeCompetencyWeight(q, competencies);
			const freshnessWeight = computeFreshnessWeight(q.questionId, seenIds);
			const similarityWeight = q.similarity;

			return {
				question: q,
				score: similarityWeight * competencyWeight * freshnessWeight,
			};
		});

		scored.sort((a, b) => b.score - a.score);

		return scored.slice(0, count).map((s) => s.question);
	} catch (e) {
		logError("AdaptivePastPaperSelector", e);
		return allScored.slice(0, count);
	}
}

export async function recordSeenQuestions(
	questionIds: string[],
	subject: string,
	deps: { db: DataAccess },
): Promise<void> {
	try {
		const now = Date.now();
		for (const id of questionIds) {
			await deps.db.seenPastPaperQuestions.add({
				questionId: id,
				subject,
				seenAt: now,
			});
		}
	} catch (e) {
		logError("RecordSeenQuestions", e);
	}
}
