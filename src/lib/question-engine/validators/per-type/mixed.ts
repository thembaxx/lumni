import type { Question, QuestionBody, ValidationError } from "../../types";

export function validate(question: Question): {
	errors: ValidationError[];
	warnings: ValidationError[];
} {
	const body = question.body as QuestionBody["mixed"];
	const errors: ValidationError[] = [];
	const warnings: ValidationError[] = [];

	if (!body.parts || body.parts.length < 2) {
		errors.push({
			type: "schema",
			field: "parts",
			message: "Need at least 2 parts for mixed question",
			severity: "error",
		});
	}

	if (body.parts) {
		const totalPoints = body.parts.reduce((s, p) => s + (p.points || 0), 0);
		if (totalPoints !== question.points) {
			warnings.push({
				type: "consistency",
				field: "points",
				message: "Part points sum doesn't match question points",
				severity: "warning",
			});
		}
	}

	return { errors, warnings };
}
