import type { Question, ValidationError, ValidationResult } from "../types";
import {
	checkDifficulty,
	checkLength,
	checkPoints,
} from "./shared-quality-checks";

export function validateCalculation(
	question: Question<"calculation">,
): ValidationResult {
	const errors: ValidationError[] = [];
	const warnings: ValidationError[] = [];

	errors.push(...checkLength(question.questionText, "questionText", 10));
	errors.push(...checkDifficulty(question.difficulty, "difficulty"));
	errors.push(...checkPoints(question.points, "points"));

	if (question.body.correctValue == null || isNaN(question.body.correctValue)) {
		errors.push({
			type: "schema",
			field: "correctValue",
			message: "Correct value required",
			severity: "error",
		});
	}

	if (!question.body.unit || question.body.unit.trim().length === 0) {
		errors.push({
			type: "schema",
			field: "unit",
			message: "Unit required",
			severity: "error",
		});
	}

	if (question.body.tolerance < 0) {
		errors.push({
			type: "schema",
			field: "tolerance",
			message: "Tolerance must be non-negative",
			severity: "error",
		});
	}

	if (!question.body.formula || question.body.formula.trim().length < 3) {
		warnings.push({
			type: "quality",
			field: "formula",
			message: "Formula is missing or too short",
			severity: "warning",
		});
	}

	if (!question.steps || question.steps.length === 0) {
		warnings.push({
			type: "quality",
			field: "steps",
			message: "Step-by-step solution recommended",
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
