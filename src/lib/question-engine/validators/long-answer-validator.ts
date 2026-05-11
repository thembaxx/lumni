import type { Question, ValidationError, ValidationResult } from "../types";
import { checkDifficulty, checkLength, checkPoints } from "./shared-quality-checks";

export function validateLongAnswer(question: Question<"long-answer">): ValidationResult {
	const errors: ValidationError[] = [];
	const warnings: ValidationError[] = [];

	errors.push(...checkLength(question.questionText, "questionText", 10));
	errors.push(...checkDifficulty(question.difficulty, "difficulty"));
	errors.push(...checkPoints(question.points, "points"));

	if (!question.body.rubric || question.body.rubric.length < 1) {
		errors.push({ type: "schema", field: "rubric", message: "At least 1 rubric criterion required", severity: "error" });
	}

	if (question.body.rubric) {
		const totalMax = question.body.rubric.reduce((s, r) => s + r.maxScore, 0);
		if (totalMax <= 0) {
			errors.push({ type: "consistency", field: "rubric", message: "Rubric max scores must sum to > 0", severity: "error" });
		}
	}

	if (question.body.minWords > question.body.maxWords) {
		errors.push({ type: "consistency", field: "wordLimit", message: "minWords cannot exceed maxWords", severity: "error" });
	}

	if (!question.body.modelAnswer || question.body.modelAnswer.trim().length < 20) {
		warnings.push({ type: "quality", field: "modelAnswer", message: "Model answer should be detailed", severity: "warning" });
	}

	const score = Math.max(0, 100 - errors.length * 15 - warnings.length * 5);
	return { isValid: errors.filter((e) => e.severity === "error").length === 0, errors, warnings, score };
}
