import type { PromptManager } from "../../prompt-manager";
import type {
	GradingResult,
	Question,
	QuestionBody,
	UserAnswer,
} from "../../types";
import type { GradeFn, HintFn } from "../types";

export const grade: GradeFn = (q, a) => {
	const pairs = q.body as QuestionBody["matching"];
	const userPairs = a.value as { left: string; right: string }[];
	let correctCount = 0;
	for (const up of userPairs) {
		if (
			pairs.pairs.some(
				(cp: { left: string; right: string }) =>
					cp.left === up.left && cp.right === up.right,
			)
		) {
			correctCount++;
		}
	}
	const score = Math.round((correctCount / pairs.pairs.length) * q.points);
	return {
		correct: correctCount === pairs.pairs.length,
		score,
		maxScore: q.points,
		feedback:
			correctCount === pairs.pairs.length
				? "All matches correct!"
				: `${correctCount}/${pairs.pairs.length} matches correct.`,
	};
};

export const hint: HintFn = (q) => {
	const body = q.body as QuestionBody["matching"];
	return `Try matching these pairs correctly. You have ${body.pairs.length} items to match.`;
};
