import type { Question, ValidationError, ValidationResult } from "../types";
import { checkDifficulty, checkLength, checkPoints } from "./shared-quality-checks";

export function validateSourceBased(question: Question<"source-based">): ValidationResult {
	const errors: ValidationError[] = [];
	const warnings: ValidationError[] = [];

	errors.push(...checkLength(question.questionText, "questionText", 10));
	errors.push(...checkDifficulty(question.difficulty, "difficulty"));
	errors.push(...checkPoints(question.points, "points"));

	if (!question.body.source) {
		errors.push({ type: "schema", field: "source", message: "Source material required", severity: "error" });
	}

	if (!question.body.source?.content || question.body.source.content.trim().length < 10) {
		errors.push({ type: "schema", field: "sourceContent", message: "Source content must be substantial", severity: "error" });
	}

	if (!question.body.subQuestions || question.body.subQuestions.length < 1) {
		errors.push({ type: "schema", field: "subQuestions", message: "At least 1 sub-question required", severity: "error" });
	}

	const score = Math.max(0, 100 - errors.length * 15 - warnings.length * 5);
	return { isValid: errors.filter((e) => e.severity === "error").length === 0, errors, warnings, score };
}
