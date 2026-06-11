import { competencyService } from "./competency-service";

export async function trackLessonCompletion(
	userId: string,
	subjectId: string,
	topicId: string,
	_subtopicId: string,
	score: number,
): Promise<void> {
	if (!userId || !subjectId || !topicId) return;

	const weight = score >= 80 ? 1.5 : score >= 50 ? 1.0 : 0.5;
	const bloomLevel = "understand" as const;

	await competencyService.update(subjectId, topicId, bloomLevel, score, weight);
}

export async function trackComprehensionResult(
	userId: string,
	storyId: string,
	subjectId: string,
	scores: number[],
): Promise<void> {
	if (!userId || !subjectId || scores.length === 0) return;

	const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
	const topicId = `comprehension:${storyId}`;
	const weight = avg >= 80 ? 1.5 : avg >= 50 ? 1.0 : 0.5;
	const bloomLevel = "analyze" as const;

	await competencyService.update(subjectId, topicId, bloomLevel, avg, weight);
}
