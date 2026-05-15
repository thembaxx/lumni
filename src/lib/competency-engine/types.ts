import type { BloomLevel } from "@/lib/question-engine/types";

export type CompetencyLevel =
	| "novice"
	| "developing"
	| "proficient"
	| "mastered";

export interface CompetencyRecord {
	id?: number;
	subjectId: string;
	topicId: string;
	bloomLevel: BloomLevel;
	score: number;
	attempts: number;
	lastAssessed: number;
	level: CompetencyLevel;
}

export function computeCompetencyLevel(score: number): CompetencyLevel {
	if (score >= 85) return "mastered";
	if (score >= 65) return "proficient";
	if (score >= 40) return "developing";
	return "novice";
}

export function computeBloomWeight(
	curriculum: { topics: Array<{ id: string; bloomTarget: string }> } | null,
	topic: string,
	bloomLevel: string,
): number {
	if (!curriculum) return 1.0;
	const topicDef = curriculum.topics.find((t) => t.id === topic);
	if (!topicDef) return 1.0;
	const bloomOrder = [
		"remember",
		"understand",
		"apply",
		"analyze",
		"evaluate",
		"create",
	];
	const questionLevel = bloomOrder.indexOf(bloomLevel);
	const targetLevel = bloomOrder.indexOf(topicDef.bloomTarget);
	if (questionLevel > targetLevel) return 0.5;
	return 1.0;
}

export function computeWeightedScore(
	existingScore: number,
	existingAttempts: number,
	questionScore: number,
	weight: number,
): number {
	const totalWeight = existingAttempts + weight;
	if (totalWeight === 0) return questionScore;
	return (
		(existingScore * existingAttempts + questionScore * weight) / totalWeight
	);
}
