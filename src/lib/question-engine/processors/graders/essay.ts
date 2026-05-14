import type { PromptManager } from "../../prompt-manager";
import type { GradingResult, Question, QuestionBody, UserAnswer } from "../../types";
import type { GradeFn, HintFn } from "../types";
import { aiGradeResult } from "./shared";

export const grade: GradeFn = (q, a, prompts) => {
	const student = a.value as string;
	if (!student || student.trim().length < 20) {
		return Promise.resolve({
			correct: false,
			score: 0,
			maxScore: q.points,
			feedback: "Essay is too short to grade.",
		});
	}
	return aiGradeResult(q, a, prompts, (q: Question, _a: UserAnswer) => {
		const b = q.body as QuestionBody["essay"];
		return `Question: ${q.questionText}\nRubric: ${JSON.stringify(b.rubric)}\nModel answer: ${b.modelAnswer}\nStudent essay: ${_a.value as string}`;
	});
};

export const hint: HintFn = (q) => {
	const body = q.body as QuestionBody["essay"];
	return `Structure your essay around these criteria: ${body.rubric.map((r) => r.name).join(", ")}. Make sure to address each one.`;
};

export const temperature = 0.7;
