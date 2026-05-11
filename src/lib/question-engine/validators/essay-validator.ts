import type { Question, ValidationError, ValidationResult } from "../types";
import {
	checkDifficulty,
	checkLength,
	checkPoints,
} from "./shared-quality-checks";

export function validateEssay(question: Question<"essay">): ValidationResult {
	const errors: ValidationError[] = [];
	const warnings: ValidationError[] = [];

	errors.push(...checkLength(question.questionText, "questionText", 20));
	errors.push(...checkDifficulty(question.difficulty, "difficulty"));
	errors.push(...checkPoints(question.points, "points"));

	if (!question.body.rubric || question.body.rubric.length < 2) {
		errors.push({
			type: "schema",
			field: "rubric",
			message: "Need at least 2 rubric criteria",
			severity: "error",
		});
	}

	if (
		!question.body.modelAnswer ||
		question.body.modelAnswer.trim().length < 50
	) {
		warnings.push({
			type: "quality",
			field: "modelAnswer",
			message: "Essay model answer should be substantial",
			severity: "warning",
		});
	}

	if (question.body.wordLimit < 100) {
		warnings.push({
			type: "quality",
			field: "wordLimit",
			message: "Word limit seems very low for an essay",
			severity: "warning",
		});
	}

	const score = Math.max(0, 100 - errors.length * 15 - warnings.length * 5);
	return {
		isValid: errors.filter((e) => e.severity === "error").length === 0,
		errors,
		warnings,
		score,
	};
}
