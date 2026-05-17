import type { BloomLevel } from "@/lib/question-engine/types";
import { competencyService } from "./competency-service";

export interface TrackResultParams {
	subjectId: string;
	topicId: string;
	bloomLevel: BloomLevel;
	score: number;
	maxScore: number;
}

export async function trackQuestionResult(
	params: TrackResultParams,
): Promise<void> {
	const { subjectId, topicId, bloomLevel, score, maxScore } = params;

	const competencyScore = maxScore > 0 ? (score / maxScore) * 100 : score;

	await competencyService.update(
		subjectId,
		topicId,
		bloomLevel,
		competencyScore,
		1,
	);
}

export function isPassingScore(
	score: number,
	maxScore: number,
	threshold = 0.5,
): boolean {
	return maxScore > 0 ? score / maxScore >= threshold : score >= threshold;
}
