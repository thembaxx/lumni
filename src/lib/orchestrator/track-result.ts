import type { BloomLevel, QuestionType } from "@/lib/question-engine/types";
import { updateChallengeEntry } from "@/lib/study-groups/challenge-service";
import { XP_PER_CORRECT, XP_PER_QUESTION } from "@/types/gamification";
import { enqueueGradeSideEffects } from "./grading";

export interface TrackResultParams {
	subjectId: string;
	topicId: string;
	bloomLevel: BloomLevel;
	score: number;
	maxScore: number;
	questionType?: QuestionType;
	correct?: boolean;
	questionText?: string;
	userId?: string;
	paperId?: string;
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

	const accuracy =
		maxScore > 0
			? Math.round((score / maxScore) * 100)
			: score >= 0.5
				? 100
				: 0;
	const xpGained = XP_PER_QUESTION + (isCorrect ? XP_PER_CORRECT : 0);

	await Promise.allSettled([
		enqueueGradeSideEffects({
			subject: subjectId,
			topic: topicId,
			bloomLevel,
			questionType: questionType ?? "short-answer",
			score,
			maxScore,
			correct: isCorrect,
			paperId: params.paperId,
		}),
		params.userId
			? updateChallengeEntry(params.userId, xpGained, 1, accuracy)
			: Promise.resolve(),
	]);
}

export function isPassingScore(
	score: number,
	maxScore: number,
	threshold = 0.5,
): boolean {
	return maxScore > 0 ? score / maxScore >= threshold : score >= threshold;
}
