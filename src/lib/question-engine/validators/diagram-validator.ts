import type { Question, ValidationError, ValidationResult } from "../types";
import { checkDifficulty, checkLength, checkPoints } from "./shared-quality-checks";

export function validateDiagram(question: Question<"diagram">): ValidationResult {
	const errors: ValidationError[] = [];
	const warnings: ValidationError[] = [];

	errors.push(...checkLength(question.questionText, "questionText", 10));
	errors.push(...checkDifficulty(question.difficulty, "difficulty"));
	errors.push(...checkPoints(question.points, "points"));

	if (!question.body.diagramData) {
		errors.push({ type: "schema", field: "diagramData", message: "Diagram data required", severity: "error" });
	}

	if (question.body.diagramData && !question.body.diagramData.type) {
		errors.push({ type: "schema", field: "diagramType", message: "Diagram type required", severity: "error" });
	}

	if (!question.body.instructions || question.body.instructions.trim().length < 5) {
		errors.push({ type: "schema", field: "instructions", message: "Instructions required for diagram question", severity: "error" });
	}

	const score = Math.max(0, 100 - errors.length * 15 - warnings.length * 5);
	return { isValid: errors.filter((e) => e.severity === "error").length === 0, errors, warnings, score };
}
