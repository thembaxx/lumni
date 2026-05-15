import type { Question, QuestionBody, ValidationError } from "../../types";

export function validate(
	question: Question,
): { errors: ValidationError[]; warnings: ValidationError[] } {
	const body = question.body as QuestionBody["long-answer"];
	const errors: ValidationError[] = [];
	const warnings: ValidationError[] = [];

	if (!body.rubric || body.rubric.length < 1) {
		errors.push({
			type: "schema",
			field: "rubric",
			message: "At least 1 rubric criterion required",
			severity: "error",
		});
	}

	if (body.rubric) {
		const totalMax = body.rubric.reduce((s, r) => s + r.maxScore, 0);
		if (totalMax <= 0) {
			errors.push({
				type: "consistency",
				field: "rubric",
				message: "Rubric max scores must sum to > 0",
				severity: "error",
			});
		}
	}

	if (body.minWords > body.maxWords) {
		errors.push({
			type: "consistency",
			field: "wordLimit",
			message: "minWords cannot exceed maxWords",
			severity: "error",
		});
	}

	if (!body.modelAnswer || body.modelAnswer.trim().length < 20) {
		warnings.push({
			type: "quality",
			field: "modelAnswer",
			message: "Model answer should be detailed",
			severity: "warning",
		});
	}

	return { errors, warnings };
}
