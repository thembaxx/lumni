import type { Question, QuestionBody, ValidationError } from "../../types";

export function validate(
	question: Question,
): { errors: ValidationError[]; warnings: ValidationError[] } {
	const body = question.body as QuestionBody["short-answer"];
	const errors: ValidationError[] = [];
	const warnings: ValidationError[] = [];

	if (!body.modelAnswer || body.modelAnswer.trim().length < 3) {
		errors.push({
			type: "schema",
			field: "modelAnswer",
			message: "Model answer must be at least 3 characters",
			severity: "error",
		});
	}

	if (!body.acceptableAnswers || body.acceptableAnswers.length === 0) {
		warnings.push({
			type: "quality",
			field: "acceptableAnswers",
			message: "No acceptable alternatives provided",
			severity: "warning",
		});
	}

	if (!question.explanation || question.explanation.trim().length < 10) {
		warnings.push({
			type: "schema",
			field: "explanation",
			message: "Explanation should be at least 10 characters",
			severity: "warning",
		});
	}

	return { errors, warnings };
}
