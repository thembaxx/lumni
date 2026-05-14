import type {
	Question,
	QuestionBody,
	ValidationError,
	ValidationResult,
} from "../types";
import {
	checkDifficulty,
	checkGibberish,
	checkLength,
	checkPlaceholders,
	checkPoints,
} from "./shared-quality-checks";

function scoreResult(
	errors: ValidationError[],
	warnings: ValidationError[],
): ValidationResult {
	const score = Math.max(0, 100 - errors.length * 15 - warnings.length * 5);
	return {
		isValid: errors.filter((e) => e.severity === "error").length === 0,
		errors: errors.filter((e) => e.severity === "error"),
		warnings: warnings.filter((w) => w.severity === "warning"),
		score,
	};
}

export function validateQuestion(question: Question): ValidationResult {
	const errors: ValidationError[] = [];
	const warnings: ValidationError[] = [];

	const minTextLen =
		question.type === "essay" || question.type === "programming" ? 20 : 10;
	errors.push(
		...checkLength(question.questionText, "questionText", minTextLen),
	);
	errors.push(...checkDifficulty(question.difficulty, "difficulty"));
	errors.push(...checkPoints(question.points, "points"));

	switch (question.type) {
		case "multiple-choice": {
			const body = question.body as QuestionBody["multiple-choice"];
			warnings.push(...checkGibberish(question.questionText, "questionText"));
			warnings.push(
				...checkPlaceholders(question.questionText, "questionText"),
			);

			if (!body.options || body.options.length < 2) {
				errors.push({
					type: "schema",
					field: "options",
					message: "Must have at least 2 options",
					severity: "error",
				});
			}

			const correctCount = body.options.filter((o) => o.isCorrect).length;
			if (correctCount === 0) {
				errors.push({
					type: "consistency",
					field: "options",
					message: "No correct answer specified",
					severity: "error",
				});
			}
			if (correctCount > 1 && !body.allowMultiple) {
				errors.push({
					type: "consistency",
					field: "options",
					message: "Multiple correct answers but allowMultiple is false",
					severity: "error",
				});
			}

			const optLengths = body.options.map((o) => o.text.length);
			const avg = optLengths.reduce((a, b) => a + b, 0) / optLengths.length;
			const variance =
				optLengths.reduce((s, l) => s + Math.pow(l - avg, 2), 0) /
				optLengths.length;
			if (variance > 100) {
				warnings.push({
					type: "quality",
					field: "options",
					message: "Option lengths vary significantly",
					severity: "warning",
				});
			}

			if (
				new Set(body.options.map((o) => o.text.toLowerCase().trim())).size !==
				body.options.length
			) {
				warnings.push({
					type: "quality",
					field: "options",
					message: "Duplicate options detected",
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
			break;
		}

		case "matching": {
			const body = question.body as QuestionBody["matching"];
			if (!body.pairs || body.pairs.length < 2) {
				errors.push({
					type: "schema",
					field: "pairs",
					message: "Need at least 2 pairs",
					severity: "error",
				});
			}

			if (body.pairs) {
				const leftSet = new Set(body.pairs.map((p) => p.left));
				const rightSet = new Set(body.pairs.map((p) => p.right));
				if (
					leftSet.size !== body.pairs.length ||
					rightSet.size !== body.pairs.length
				) {
					errors.push({
						type: "consistency",
						field: "pairs",
						message: "Duplicate left or right items",
						severity: "error",
					});
				}
			}
			break;
		}

		case "short-answer": {
			const body = question.body as QuestionBody["short-answer"];
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
			break;
		}

		case "long-answer": {
			const body = question.body as QuestionBody["long-answer"];
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
			break;
		}

		case "essay": {
			const body = question.body as QuestionBody["essay"];
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
			break;
		}

		case "calculation": {
			const body = question.body as QuestionBody["calculation"];
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
			break;
		}

		case "diagram": {
			const body = question.body as QuestionBody["diagram"];
			if (!body.diagramData) {
				errors.push({
					type: "schema",
					field: "diagramData",
					message: "Diagram data required",
					severity: "error",
				});
			}

			if (body.diagramData && !body.diagramData.type) {
				errors.push({
					type: "schema",
					field: "diagramType",
					message: "Diagram type required",
					severity: "error",
				});
			}

			if (!body.instructions || body.instructions.trim().length < 5) {
				errors.push({
					type: "schema",
					field: "instructions",
					message: "Instructions required for diagram question",
					severity: "error",
				});
			}
			break;
		}

		case "source-based": {
			const body = question.body as QuestionBody["source-based"];
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
			break;
		}

		case "programming": {
			const body = question.body as QuestionBody["programming"];
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
			break;
		}

		case "data-response": {
			const body = question.body as QuestionBody["data-response"];
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
			break;
		}

		case "mixed": {
			const body = question.body as QuestionBody["mixed"];
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
			break;
		}
	}

	return scoreResult(errors, warnings);
}
