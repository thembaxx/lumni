import type { QuestionBody } from "../../types";
import type { GradeFn, HintFn } from "../types";

export const grade: GradeFn = (q, a) => {
	const body = q.body as QuestionBody["fill-in-sequence"];
	const userAnswers = a.value as Record<string, string>;
	const blanks = body.blanks;

	if (!userAnswers || Object.keys(userAnswers).length === 0) {
		return {
			correct: false,
			score: 0,
			maxScore: q.points,
			feedback: "No blanks filled. Please fill in all blanks.",
		};
	}

	let correctCount = 0;
	for (const blank of blanks) {
		if (
			userAnswers[blank.id]?.toLowerCase().trim() ===
			blank.correctAnswer.toLowerCase().trim()
		) {
			correctCount++;
		}
	}

	const isExact = correctCount === blanks.length;
	const score = Math.round((correctCount / blanks.length) * q.points);

	return {
		correct: isExact,
		score,
		maxScore: q.points,
		feedback: isExact
			? "All blanks filled correctly!"
			: `${correctCount}/${blanks.length} blanks filled correctly.`,
	};
};

export const hint: HintFn = (q) => {
	const _body = q.body as QuestionBody["fill-in-sequence"];
	return `Look at the context around each blank. The surrounding words give clues about what belongs there.`;
};
