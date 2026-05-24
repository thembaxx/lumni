import { enqueueGradeSideEffects } from "./grading";
import type { BloomLevel, QuestionType } from "@/lib/question-engine/types";

export interface TrackResultParams {
	subjectId: string;
	topicId: string;
	bloomLevel: BloomLevel;
	score: number;
	maxScore: number;
	questionType?: QuestionType;
	correct?: boolean;
	questionText?: string;
}

export async function trackQuestionResult(
	params: TrackResultParams,
): Promise<void> {
	const {
		subjectId,
		topicId,
		bloomLevel,
		score,
		maxScore,
		questionType,
		correct,
	} = params;

	const isCorrect =
		correct ?? (maxScore > 0 ? score / maxScore >= 0.5 : score >= 0.5);

	await enqueueGradeSideEffects({
		subject: subjectId,
		topic: topicId,
		bloomLevel,
		questionType: questionType ?? "short-answer",
		score,
		maxScore,
		correct: isCorrect,
	});
}

export function isPassingScore(
	score: number,
	maxScore: number,
	threshold = 0.5,
): boolean {
	return maxScore > 0 ? score / maxScore >= threshold : score >= threshold;
}
