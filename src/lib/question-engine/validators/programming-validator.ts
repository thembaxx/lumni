import type { Question, ValidationError, ValidationResult } from "../types";
import {
	checkDifficulty,
	checkLength,
	checkPoints,
} from "./shared-quality-checks";

export function validateProgramming(
	question: Question<"programming">,
): ValidationResult {
	const errors: ValidationError[] = [];
	const warnings: ValidationError[] = [];

	errors.push(...checkLength(question.questionText, "questionText", 20));
	errors.push(...checkDifficulty(question.difficulty, "difficulty"));
	errors.push(...checkPoints(question.points, "points"));

	if (!question.body.language) {
		errors.push({
			type: "schema",
			field: "language",
			message: "Programming language required",
			severity: "error",
		});
	}

	if (!question.body.testCases || question.body.testCases.length === 0) {
		errors.push({
			type: "schema",
			field: "testCases",
			message: "At least 1 test case required",
			severity: "error",
		});
	}

	if (question.body.testCases) {
		const hasEmptyIO = question.body.testCases.some(
			(t) => !t.input || !t.expectedOutput,
		);
		if (hasEmptyIO) {
			errors.push({
				type: "schema",
				field: "testCases",
				message: "All test cases need input and expectedOutput",
				severity: "error",
			});
		}
	}

	if (question.body.timeLimit < 1000) {
		warnings.push({
			type: "quality",
			field: "timeLimit",
			message: "Time limit seems very short",
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
