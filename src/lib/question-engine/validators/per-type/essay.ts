import type { Question, QuestionBody, ValidationError } from "../../types";

export function validate(
	question: Question,
): { errors: ValidationError[]; warnings: ValidationError[] } {
	const body = question.body as QuestionBody["essay"];
	const errors: ValidationError[] = [];
	const warnings: ValidationError[] = [];

	if (!body.rubric || body.rubric.length < 2) {
		errors.push({
			type: "schema",
			field: "rubric",
			message: "Need at least 2 rubric criteria",
			severity: "error",
		});
	}

	if (!body.modelAnswer || body.modelAnswer.trim().length < 50) {
		warnings.push({
			type: "quality",
			field: "modelAnswer",
			message: "Essay model answer should be substantial",
			severity: "warning",
		});
	}

	if (body.wordLimit < 100) {
		warnings.push({
			type: "quality",
			field: "wordLimit",
			message: "Word limit seems very low for an essay",
			severity: "warning",
		});
	}

	return { errors, warnings };
}
