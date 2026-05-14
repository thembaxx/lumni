import type { PromptManager } from "../../prompt-manager";
import type { GradingResult, Question, QuestionBody, UserAnswer } from "../../types";
import type { GradeFn, HintFn } from "../types";

export const grade: GradeFn = (q, a) => {
	const body = q.body as QuestionBody["calculation"];
	const studentAnswer = a.value as { value: number; unit?: string };
	if (studentAnswer == null || studentAnswer.value == null) {
		return {
			correct: false,
			score: 0,
			maxScore: q.points,
			feedback: "No answer provided.",
		};
	}
	const numericDiff = Math.abs(studentAnswer.value - body.correctValue);
	const unitCorrect = studentAnswer.unit
		? studentAnswer.unit.toLowerCase().trim() === body.unit.toLowerCase().trim()
		: true;
	const valueCorrect = numericDiff <= body.tolerance;
	if (valueCorrect && !unitCorrect) {
		return {
			correct: false,
			score: Math.round(q.points * 0.7),
			maxScore: q.points,
			feedback: `Your value is correct, but the unit should be "${body.unit}".`,
		};
	}
	return {
		correct: valueCorrect && unitCorrect,
		score: valueCorrect && unitCorrect ? q.points : 0,
		maxScore: q.points,
		feedback:
			valueCorrect && unitCorrect
				? `Correct! The answer is ${body.correctValue} ${body.unit}.`
				: `Incorrect. The correct answer is ${body.correctValue} ${body.unit} (tolerance: \u00B1${body.tolerance}).`,
	};
};

export const hint: HintFn = (q) => {
	const body = q.body as QuestionBody["calculation"];
	if (q.steps && q.steps.length > 0) {
		return `Try following these steps:\n${q.steps.slice(0, 2).join("\n")}\n... then continue with the same approach.`;
	}
	return `Recall the formula: ${body.formula}. Make sure your answer includes the correct unit (${body.unit}).`;
};

export const temperature = 0.6;
