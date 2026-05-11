import type { Question, ValidationError, ValidationResult } from "../types";
import { checkDifficulty, checkLength, checkPoints } from "./shared-quality-checks";

export function validateMixed(question: Question<"mixed">): ValidationResult {
	const errors: ValidationError[] = [];
	const warnings: ValidationError[] = [];

	errors.push(...checkLength(question.questionText, "questionText", 10));
	errors.push(...checkDifficulty(question.difficulty, "difficulty"));
	errors.push(...checkPoints(question.points, "points"));

	if (!question.body.parts || question.body.parts.length < 2) {
		errors.push({ type: "schema", field: "parts", message: "Need at least 2 parts for mixed question", severity: "error" });
	}

	if (question.body.parts) {
		const totalPoints = question.body.parts.reduce((s, p) => s + (p.points || 0), 0);
		if (totalPoints !== question.points) {
			warnings.push({ type: "consistency", field: "points", message: "Part points sum doesn't match question points", severity: "warning" });
		}
	}

	const score = Math.max(0, 100 - errors.length * 15 - warnings.length * 5);
	return { isValid: errors.filter((e) => e.severity === "error").length === 0, errors, warnings, score };
}
