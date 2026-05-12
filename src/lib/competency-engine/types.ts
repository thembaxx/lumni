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
