import type { Question, QuestionBody, ValidationError } from "../../types";

export function validate(question: Question): {
	errors: ValidationError[];
	warnings: ValidationError[];
} {
	const body = question.body as QuestionBody["match-pairs"];
	const errors: ValidationError[] = [];
	const warnings: ValidationError[] = [];

	if (!body.leftItems || body.leftItems.length < 2) {
		errors.push({
			type: "schema",
			field: "leftItems",
			message: "Need at least 2 left items",
			severity: "error",
		});
	}

	if (!body.rightItems || body.rightItems.length !== body.leftItems?.length) {
		errors.push({
			type: "schema",
			field: "rightItems",
			message: "Right items must match left items count",
			severity: "error",
		});
	}

	if (
		!body.correctMatches ||
		body.correctMatches.length !== body.leftItems?.length
	) {
		errors.push({
			type: "schema",
			field: "correctMatches",
			message: "correctMatches must cover all pairs",
			severity: "error",
		});
	}

	return { errors, warnings };
}
