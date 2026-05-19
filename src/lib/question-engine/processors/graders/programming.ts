import type { Question, QuestionBody, UserAnswer } from "../../types";
import type { GradeFn, HintFn } from "../types";
import { aiGradeResult } from "./shared";

export const grade: GradeFn = (q, a, prompts) => {
	const code = a.value as string;
	if (!code) {
		return Promise.resolve({
			correct: false,
			score: 0,
			maxScore: q.points,
			feedback: "No code submitted.",
		});
	}
	return aiGradeResult(q, a, prompts, (q: Question, _a: UserAnswer) => {
		const body = q.body as QuestionBody["programming"];
		return `Problem: ${q.questionText}\nLanguage: ${body.language}\nTest cases: ${JSON.stringify(body.testCases)}\nStudent code:\n${_a.value as string}`;
	});
};

export const hint: HintFn = (q) => {
	const body = q.body as QuestionBody["programming"];
	return `Think about the algorithm first. Consider edge cases. The function should handle ${body.testCases.length} test case(s).`;
};
