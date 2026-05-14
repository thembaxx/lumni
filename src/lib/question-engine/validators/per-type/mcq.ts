import type { Question, QuestionBody, ValidationError } from "../../types";
import { checkGibberish, checkPlaceholders } from "../shared-quality-checks";

export function validate(
	question: Question,
	errors: ValidationError[],
	warnings: ValidationError[],
): void {
	const body = question.body as QuestionBody["multiple-choice"];
	warnings.push(...checkGibberish(question.questionText, "questionText"));
	warnings.push(
		...checkPlaceholders(question.questionText, "questionText"),
	);

	if (!body.options || body.options.length < 2) {
		errors.push({
			type: "schema",
			field: "options",
			message: "Must have at least 2 options",
			severity: "error",
		});
	}

	const correctCount = body.options.filter((o) => o.isCorrect).length;
	if (correctCount === 0) {
		errors.push({
			type: "consistency",
			field: "options",
			message: "No correct answer specified",
			severity: "error",
		});
	}
	if (correctCount > 1 && !body.allowMultiple) {
		errors.push({
			type: "consistency",
			field: "options",
			message: "Multiple correct answers but allowMultiple is false",
			severity: "error",
		});
	}

	const optLengths = body.options.map((o) => o.text.length);
	const avg = optLengths.reduce((a, b) => a + b, 0) / optLengths.length;
	const variance =
		optLengths.reduce((s, l) => s + Math.pow(l - avg, 2), 0) /
		optLengths.length;
	if (variance > 100) {
		warnings.push({
			type: "quality",
			field: "options",
			message: "Option lengths vary significantly",
			severity: "warning",
		});
	}

	if (
		new Set(body.options.map((o) => o.text.toLowerCase().trim())).size !==
		body.options.length
	) {
		warnings.push({
			type: "quality",
			field: "options",
			message: "Duplicate options detected",
			severity: "warning",
		});
	}

	if (!question.explanation || question.explanation.trim().length < 10) {
		warnings.push({
			type: "schema",
			field: "explanation",
			message: "Explanation should be at least 10 characters",
			severity: "warning",
		});
	}
}
