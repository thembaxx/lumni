import type { Question, QuestionBody, ValidationError } from "../../types";

export function validate(
	question: Question,
): { errors: ValidationError[]; warnings: ValidationError[] } {
	const body = question.body as QuestionBody["data-response"];
	const errors: ValidationError[] = [];
	const warnings: ValidationError[] = [];

	if (!body.data) {
		errors.push({
			type: "schema",
			field: "data",
			message: "Data set required",
			severity: "error",
		});
	}

	if (!body.questions || body.questions.length < 1) {
		errors.push({
			type: "schema",
			field: "questions",
			message: "At least 1 question required",
			severity: "error",
		});
	}

	return { errors, warnings };
}
