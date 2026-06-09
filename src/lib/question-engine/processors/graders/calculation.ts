import type { QuestionBody } from "../../types";
import type { GradeFn, HintFn } from "../types";

function parseAnswer(raw: unknown): { value: number; unit?: string } {
	if (raw == null) return { value: NaN };
	const v = raw as Record<string, unknown>;
	if (typeof v.value === "number") return v as { value: number; unit?: string };
	if (typeof v.value === "string")
		return { value: parseFloat(v.value), unit: v.unit as string | undefined };
	if (typeof raw === "string") {
		const match = raw
			.trim()
			.match(/^(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\s*(.*?)$/);
		if (match)
			return {
				value: parseFloat(match[1]),
				unit: match[2].trim() || undefined,
			};
		return { value: NaN };
	}
	return { value: NaN };
}

export const grade: GradeFn = (q, a) => {
	const body = q.body as QuestionBody["calculation"];
	const studentAnswer = a.value as { value: number; unit?: string } | string;
	const parsed =
		typeof studentAnswer === "string"
			? parseAnswer(studentAnswer)
			: parseAnswer(studentAnswer as unknown);
	if (Number.isNaN(parsed.value)) {
		return {
			correct: false,
			score: 0,
			maxScore: q.points,
			feedback: "No answer provided.",
		};
	}
	const numericDiff = Math.abs(parsed.value - body.correctValue);
	const unitCorrect = parsed.unit
		? parsed.unit.toLowerCase().trim() === body.unit.toLowerCase().trim()
		: !body.unit;
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
