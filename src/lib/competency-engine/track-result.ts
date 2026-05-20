import { enqueue } from "@/lib/orchestrator/job-queue";
import type { BloomLevel, QuestionType } from "@/lib/question-engine/types";
import { competencyService } from "./competency-service";

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

	const competencyScore = maxScore > 0 ? (score / maxScore) * 100 : score;
	const isCorrect =
		correct ?? (maxScore > 0 ? score / maxScore >= 0.5 : score >= 0.5);

	await Promise.all([
		competencyService.update(
			subjectId,
			topicId,
			bloomLevel,
			competencyScore,
			1,
		),
		enqueue("analytics-sync", {
			events: [
				{
					event: "grade",
					timestamp: Date.now(),
					subject: subjectId,
					questionType: questionType ?? "short-answer",
					success: isCorrect,
					duration: 0,
				},
			],
		}),
		enqueue("progress-update", {
			subject: subjectId,
			result: { correct: isCorrect, score },
		}),
	]);
}

export function isPassingScore(
	score: number,
	maxScore: number,
	threshold = 0.5,
): boolean {
	return maxScore > 0 ? score / maxScore >= threshold : score >= threshold;
}
