import type { Question, ValidationError, ValidationResult } from "../types";
import {
	checkDifficulty,
	checkGibberish,
	checkLength,
	checkPlaceholders,
	checkPoints,
} from "./shared-quality-checks";

export function validateMCQ(
	question: Question<"multiple-choice">,
): ValidationResult {
	const errors: ValidationError[] = [];
	const warnings: ValidationError[] = [];

	errors.push(...checkLength(question.questionText, "questionText", 10));
	errors.push(...checkDifficulty(question.difficulty, "difficulty"));
	errors.push(...checkPoints(question.points, "points"));
	warnings.push(...checkGibberish(question.questionText, "questionText"));
	warnings.push(...checkPlaceholders(question.questionText, "questionText"));

	if (!question.body.options || question.body.options.length < 2) {
		errors.push({
			type: "schema",
			field: "options",
			message: "Must have at least 2 options",
			severity: "error",
		});
	}

	const correctCount = question.body.options.filter((o) => o.isCorrect).length;
	if (correctCount === 0) {
		errors.push({
			type: "consistency",
			field: "options",
			message: "No correct answer specified",
			severity: "error",
		});
	}
	if (correctCount > 1 && !question.body.allowMultiple) {
		errors.push({
			type: "consistency",
			field: "options",
			message: "Multiple correct answers but allowMultiple is false",
			severity: "error",
		});
	}

	const optLengths = question.body.options.map((o) => o.text.length);
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
		new Set(question.body.options.map((o) => o.text.toLowerCase().trim()))
			.size !== question.body.options.length
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

	const score = Math.max(0, 100 - errors.length * 15 - warnings.length * 5);

	return {
		isValid: errors.filter((e) => e.severity === "error").length === 0,
		errors: errors.filter((e) => e.severity === "error"),
		warnings: warnings.filter((w) => w.severity === "warning"),
		score,
	};
}
