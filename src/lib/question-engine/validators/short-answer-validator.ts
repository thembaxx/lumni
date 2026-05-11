import type { Question, ValidationError, ValidationResult } from "../types";
import { checkDifficulty, checkLength, checkPoints } from "./shared-quality-checks";

export function validateShortAnswer(question: Question<"short-answer">): ValidationResult {
	const errors: ValidationError[] = [];
	const warnings: ValidationError[] = [];

	errors.push(...checkLength(question.questionText, "questionText", 10));
	errors.push(...checkDifficulty(question.difficulty, "difficulty"));
	errors.push(...checkPoints(question.points, "points"));

	if (!question.body.modelAnswer || question.body.modelAnswer.trim().length < 3) {
		errors.push({ type: "schema", field: "modelAnswer", message: "Model answer must be at least 3 characters", severity: "error" });
	}

	if (!question.body.acceptableAnswers || question.body.acceptableAnswers.length === 0) {
		warnings.push({ type: "quality", field: "acceptableAnswers", message: "No acceptable alternatives provided", severity: "warning" });
	}

	if (!question.explanation || question.explanation.trim().length < 10) {
		warnings.push({ type: "schema", field: "explanation", message: "Explanation should be at least 10 characters", severity: "warning" });
	}

	const score = Math.max(0, 100 - errors.length * 15 - warnings.length * 5);
	return { isValid: errors.filter((e) => e.severity === "error").length === 0, errors, warnings, score };
}
