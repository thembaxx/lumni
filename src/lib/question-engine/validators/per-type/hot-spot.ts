import type { Question, QuestionBody, ValidationError } from "../../types";

export function validate(question: Question): {
	errors: ValidationError[];
	warnings: ValidationError[];
} {
	const body = question.body as QuestionBody["hot-spot"];
	const errors: ValidationError[] = [];
	const warnings: ValidationError[] = [];

	if (!body.regions || body.regions.length < 2) {
		errors.push({
			type: "schema",
			field: "regions",
			message: "Need at least 2 regions to choose from",
			severity: "error",
		});
	}

	if (!body.correctRegionId) {
		errors.push({
			type: "schema",
			field: "correctRegionId",
			message: "correctRegionId is required",
			severity: "error",
		});
	}

	if (body.correctRegionId && body.regions) {
		const validIds = new Set(body.regions.map((r) => r.id));
		if (!validIds.has(body.correctRegionId)) {
			errors.push({
				type: "consistency",
				field: "correctRegionId",
				message: "correctRegionId must match one of the region IDs",
				severity: "error",
			});
		}
	}

	return { errors, warnings };
}
