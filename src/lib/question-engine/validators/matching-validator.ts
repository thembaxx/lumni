import type { Question, ValidationError, ValidationResult } from "../types";
import { checkDifficulty, checkLength, checkPoints } from "./shared-quality-checks";

export function validateMatching(question: Question<"matching">): ValidationResult {
	const errors: ValidationError[] = [];
	const warnings: ValidationError[] = [];

	errors.push(...checkLength(question.questionText, "questionText", 10));
	errors.push(...checkDifficulty(question.difficulty, "difficulty"));
	errors.push(...checkPoints(question.points, "points"));

	if (!question.body.pairs || question.body.pairs.length < 2) {
		errors.push({ type: "schema", field: "pairs", message: "Need at least 2 pairs", severity: "error" });
	}

	if (question.body.pairs) {
		const leftSet = new Set(question.body.pairs.map((p) => p.left));
		const rightSet = new Set(question.body.pairs.map((p) => p.right));
		if (leftSet.size !== question.body.pairs.length || rightSet.size !== question.body.pairs.length) {
			errors.push({ type: "consistency", field: "pairs", message: "Duplicate left or right items", severity: "error" });
		}
	}

	const score = Math.max(0, 100 - errors.length * 15 - warnings.length * 5);
	return { isValid: errors.filter((e) => e.severity === "error").length === 0, errors, warnings, score };
}
