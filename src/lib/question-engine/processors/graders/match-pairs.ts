import type { QuestionBody } from "../../types";
import type { GradeFn, HintFn } from "../types";

export const grade: GradeFn = (q, a) => {
	const body = q.body as QuestionBody["match-pairs"];
	const userMatches = a.value as Record<string, string>;
	const correctMatches = body.correctMatches;

	if (!userMatches || Object.keys(userMatches).length === 0) {
		return {
			correct: false,
			score: 0,
			maxScore: q.points,
			feedback: "No matches made. Please match all pairs.",
		};
	}

	let correctCount = 0;
	for (const match of correctMatches) {
		if (userMatches[match.leftId] === match.rightId) {
			correctCount++;
		}
	}

	const isExact = correctCount === correctMatches.length;
	const score = Math.round((correctCount / correctMatches.length) * q.points);

	return {
		correct: isExact,
		score,
		maxScore: q.points,
		feedback: isExact
			? "All pairs matched correctly!"
			: `${correctCount}/${correctMatches.length} pairs matched correctly.`,
	};
};

export const hint: HintFn = (q) => {
	const body = q.body as QuestionBody["match-pairs"];
	return `Look for connections between items. Match based on definitions, relationships, or logical associations across ${body.leftItems.length} pairs.`;
};
