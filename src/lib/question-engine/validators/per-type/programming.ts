import type { Question, QuestionBody, ValidationError } from "../../types";

export function validate(question: Question): {
	errors: ValidationError[];
	warnings: ValidationError[];
} {
	const body = question.body as QuestionBody["programming"];
	const errors: ValidationError[] = [];
	const warnings: ValidationError[] = [];

	if (!body.language) {
		errors.push({
			type: "schema",
			field: "language",
			message: "Programming language required",
			severity: "error",
		});
	}

	if (!body.testCases || body.testCases.length === 0) {
		errors.push({
			type: "schema",
			field: "testCases",
			message: "At least 1 test case required",
			severity: "error",
		});
	}

	if (body.testCases) {
		const hasEmptyIO = body.testCases.some(
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

	if (body.timeLimit < 1000) {
		warnings.push({
			type: "quality",
			field: "timeLimit",
			message: "Time limit seems very short",
			severity: "warning",
		});
	}

	return { errors, warnings };
}
