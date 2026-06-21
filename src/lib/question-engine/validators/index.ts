import type { Question, ValidationError, ValidationResult } from "../types";
import { validate as validateCalculation } from "./per-type/calculation";
import { validate as validateDataResponse } from "./per-type/data-response";
import { validate as validateDiagram } from "./per-type/diagram";
import { validate as validateDiagramLabelling } from "./per-type/diagram-labelling";
import { validate as validateEssay } from "./per-type/essay";
import { validate as validateFillInSequence } from "./per-type/fill-in-sequence";
import { validate as validateHotSpot } from "./per-type/hot-spot";
import { validate as validateLongAnswer } from "./per-type/long-answer";
import { validate as validateMatchPairs } from "./per-type/match-pairs";
import { validate as validateMatching } from "./per-type/matching";
import { validate as validateMcq } from "./per-type/mcq";
import { validate as validateMixed } from "./per-type/mixed";
import { validate as validateOrdering } from "./per-type/ordering";
import { validate as validateProgramming } from "./per-type/programming";
import { validate as validateShortAnswer } from "./per-type/short-answer";
import { validate as validateSourceBased } from "./per-type/source-based";
import {
	checkDifficulty,
	checkLength,
	checkPoints,
} from "./shared-quality-checks";

interface ValidatorResult {
	errors: ValidationError[];
	warnings: ValidationError[];
}

const typeValidators: Record<string, (question: Question) => ValidatorResult> =
	{
		"multiple-choice": validateMcq,
		matching: validateMatching,
		"short-answer": validateShortAnswer,
		"long-answer": validateLongAnswer,
		essay: validateEssay,
		calculation: validateCalculation,
		diagram: validateDiagram,
		"source-based": validateSourceBased,
		programming: validateProgramming,
		"data-response": validateDataResponse,
		mixed: validateMixed,
		ordering: validateOrdering,
		"fill-in-sequence": validateFillInSequence,
		"match-pairs": validateMatchPairs,
		"diagram-labelling": validateDiagramLabelling,
		"hot-spot": validateHotSpot,
	};

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

	if (!question.body) {
		errors.push({
			type: "schema",
			field: "body",
			message: "Question body is missing",
			severity: "error",
		});
		return scoreResult(errors, warnings);
	}

	const minTextLen =
		question.type === "essay" || question.type === "programming" ? 20 : 10;
	errors.push(
		...checkLength(question.questionText, "questionText", minTextLen),
	);
	errors.push(...checkDifficulty(question.difficulty, "difficulty"));
	errors.push(...checkPoints(question.points, "points"));

	const typeValidator = typeValidators[question.type];
	if (typeValidator) {
		const result = typeValidator(question);
		errors.push(...result.errors);
		warnings.push(...result.warnings);
	}

	return scoreResult(errors, warnings);
}
