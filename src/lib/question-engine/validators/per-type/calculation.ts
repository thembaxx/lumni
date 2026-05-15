import type { Question, QuestionBody, ValidationError } from "../../types";

export function validate(question: Question): {
	errors: ValidationError[];
	warnings: ValidationError[];
} {
	const body = question.body as QuestionBody["calculation"];
	const errors: ValidationError[] = [];
	const warnings: ValidationError[] = [];

	if (body.correctValue == null || isNaN(body.correctValue)) {
		errors.push({
			type: "schema",
			field: "correctValue",
			message: "Correct value required",
			severity: "error",
		});
	}

	if (!body.unit || body.unit.trim().length === 0) {
		errors.push({
			type: "schema",
			field: "unit",
			message: "Unit required",
			severity: "error",
		});
	}

	if (body.tolerance < 0) {
		errors.push({
			type: "schema",
			field: "tolerance",
			message: "Tolerance must be non-negative",
			severity: "error",
		});
	}

	if (!body.formula || body.formula.trim().length < 3) {
		warnings.push({
			type: "quality",
			field: "formula",
			message: "Formula is missing or too short",
			severity: "warning",
		});
	}

	if (!question.steps || question.steps.length === 0) {
		warnings.push({
			type: "quality",
			field: "steps",
			message: "Step-by-step solution recommended",
			severity: "warning",
		});
	}

	return { errors, warnings };
}
