import type { Question, QuestionBody, ValidationError } from "../../types";

export function validate(question: Question): {
	errors: ValidationError[];
	warnings: ValidationError[];
} {
	const body = question.body as QuestionBody["source-based"];
	const errors: ValidationError[] = [];
	const warnings: ValidationError[] = [];

	if (!body.source) {
		errors.push({
			type: "schema",
			field: "source",
			message: "Source material required",
			severity: "error",
		});
	}

	if (!body.source?.content || body.source.content.trim().length < 10) {
		errors.push({
			type: "schema",
			field: "sourceContent",
			message: "Source content must be substantial",
			severity: "error",
		});
	}

	if (!body.subQuestions || body.subQuestions.length < 1) {
		errors.push({
			type: "schema",
			field: "subQuestions",
			message: "At least 1 sub-question required",
			severity: "error",
		});
	}

	return { errors, warnings };
}
