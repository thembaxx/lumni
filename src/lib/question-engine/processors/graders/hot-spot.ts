import type { QuestionBody } from "../../types";
import type { GradeFn, HintFn } from "../types";

export const grade: GradeFn = (q, a) => {
	const body = q.body as QuestionBody["hot-spot"];
	const userRegionId = a.value as string;

	if (!userRegionId) {
		return {
			correct: false,
			score: 0,
			maxScore: q.points,
			feedback: "No region selected. Click on the correct area of the diagram.",
		};
	}

	const isCorrect = userRegionId === body.correctRegionId;
	return {
		correct: isCorrect,
		score: isCorrect ? q.points : 0,
		maxScore: q.points,
		feedback: isCorrect
			? "Correct region selected!"
			: `Incorrect. The correct region was "${body.regions.find((r) => r.id === body.correctRegionId)?.label ?? body.correctRegionId}".`,
	};
};

export const hint: HintFn = (q) => {
	const body = q.body as QuestionBody["hot-spot"];
	return `Look at the diagram carefully. There are ${body.regions.length} regions to choose from. Think about which one matches the question.`;
};
