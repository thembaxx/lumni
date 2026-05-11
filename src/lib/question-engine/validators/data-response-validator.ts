import type { Question, ValidationError, ValidationResult } from "../types";
import { checkDifficulty, checkLength, checkPoints } from "./shared-quality-checks";

export function validateDataResponse(question: Question<"data-response">): ValidationResult {
	const errors: ValidationError[] = [];
	const warnings: ValidationError[] = [];

	errors.push(...checkLength(question.questionText, "questionText", 10));
	errors.push(...checkDifficulty(question.difficulty, "difficulty"));
	errors.push(...checkPoints(question.points, "points"));

	if (!question.body.data) {
		errors.push({ type: "schema", field: "data", message: "Data set required", severity: "error" });
	}

	if (!question.body.questions || question.body.questions.length < 1) {
		errors.push({ type: "schema", field: "questions", message: "At least 1 question required", severity: "error" });
	}

	const score = Math.max(0, 100 - errors.length * 15 - warnings.length * 5);
	return { isValid: errors.filter((e) => e.severity === "error").length === 0, errors, warnings, score };
}
