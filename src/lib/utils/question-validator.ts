import type { QAQuestion } from "@/types/questions";

export interface ValidationError {
	type: "schema" | "quality" | "consistency" | "content";
	field: string;
	message: string;
	severity: "error" | "warning";
}

export interface QuestionValidationResult {
	isValid: boolean;
	errors: ValidationError[];
	warnings: ValidationError[];
	score: number;
}

export function validateQuestion(
	question: QAQuestion,
): QuestionValidationResult {
	const errors: ValidationError[] = [];
	const warnings: ValidationError[] = [];

	errors.push(...validateSchema(question));
	warnings.push(...validateQuality(question));
	errors.push(...validateConsistency(question));

	const score = calculateValidationScore(errors, warnings);

	return {
		isValid: errors.filter((e) => e.severity === "error").length === 0,
		errors: errors.filter((e) => e.severity === "error"),
		warnings: warnings.filter((w) => w.severity === "warning"),
		score,
	};
}

export function validateQuestions(questions: QAQuestion[]): {
	valid: QAQuestion[];
	invalid: QAQuestion[];
	results: Map<string, QuestionValidationResult>;
} {
	const results = new Map<string, QuestionValidationResult>();
	const valid: QAQuestion[] = [];
	const invalid: QAQuestion[] = [];

	for (const question of questions) {
		const result = validateQuestion(question);
		results.set(question.id, result);

		if (result.isValid) {
			valid.push(question);
		} else {
			invalid.push(question);
		}
	}

	return { valid, invalid, results };
}

function validateSchema(question: QAQuestion): ValidationError[] {
	const errors: ValidationError[] = [];

	if (!question.id || typeof question.id !== "string") {
		errors.push({
			type: "schema",
			field: "id",
			message: "Question must have a valid ID",
			severity: "error",
		});
	}

	if (!question.questionText || question.questionText.trim().length < 10) {
		errors.push({
			type: "schema",
			field: "questionText",
			message: "Question text must be at least 10 characters",
			severity: "error",
		});
	}

	if (!question.topic || typeof question.topic !== "string") {
		errors.push({
			type: "schema",
			field: "topic",
			message: "Question must have a topic",
			severity: "error",
		});
	}

	if (
		!question.options ||
		!Array.isArray(question.options) ||
		question.options.length < 2
	) {
		errors.push({
			type: "schema",
			field: "options",
			message: "Question must have at least 2 options",
			severity: "error",
		});
	}

	if (!["Easy", "Medium", "Hard"].includes(question.difficulty)) {
		errors.push({
			type: "schema",
			field: "difficulty",
			message: "Difficulty must be Easy, Medium, or Hard",
			severity: "error",
		});
	}

	if (typeof question.points !== "number" || question.points <= 0) {
		errors.push({
			type: "schema",
			field: "points",
			message: "Points must be a positive number",
			severity: "error",
		});
	}

	if (!question.explanation || question.explanation.trim().length < 10) {
		errors.push({
			type: "schema",
			field: "explanation",
			message: "Explanation must be at least 10 characters",
			severity: "warning",
		});
	}

	return errors;
}

function validateQuality(question: QAQuestion): ValidationError[] {
	const warnings: ValidationError[] = [];

	const questionText = question.questionText.toLowerCase();
	const hasGibberish =
		/(.)\1{5,}/.test(questionText) ||
		/[a-z]{20,}/.test(questionText.replace(/\s/g, ""));

	if (hasGibberish) {
		warnings.push({
			type: "quality",
			field: "questionText",
			message: "Question text may contain gibberish or be too long",
			severity: "warning",
		});
	}

	const hasPlaceholder = /\{\{|\}\}|<.*>|__|_+/g.test(question.questionText);
	if (hasPlaceholder) {
		warnings.push({
			type: "quality",
			field: "questionText",
			message: "Question contains placeholder text",
			severity: "warning",
		});
	}

	if (question.options) {
		const optionLengths = question.options.map((o) => o.text.length);
		const avgLength =
			optionLengths.reduce((a, b) => a + b, 0) / optionLengths.length;
		const variance =
			optionLengths.reduce(
				(sum, len) => sum + Math.pow(len - avgLength, 2),
				0,
			) / optionLengths.length;

		if (variance > 100) {
			warnings.push({
				type: "quality",
				field: "options",
				message:
					"Option lengths vary significantly - may reveal correct answer",
				severity: "warning",
			});
		}

		const hasDuplicateOptions =
			new Set(question.options.map((o) => o.text.toLowerCase().trim())).size !==
			question.options.length;
		if (hasDuplicateOptions) {
			warnings.push({
				type: "quality",
				field: "options",
				message: "Duplicate options detected",
				severity: "warning",
			});
		}
	}

	if (!question.hint || question.hint.trim().length < 5) {
		warnings.push({
			type: "quality",
			field: "hint",
			message: "Question should have a helpful hint",
			severity: "warning",
		});
	}

	return warnings;
}

function validateConsistency(question: QAQuestion): ValidationError[] {
	const errors: ValidationError[] = [];

	if (!question.options || question.options.length === 0) {
		return errors;
	}

	const correctOptions = question.options.filter((o) => o.isCorrect);
	if (correctOptions.length === 0) {
		errors.push({
			type: "consistency",
			field: "options",
			message: "No correct answer specified",
			severity: "error",
		});
	} else if (
		correctOptions.length > 1 &&
		question.questionType === "multiple-choice"
	) {
		errors.push({
			type: "consistency",
			field: "options",
			message: "Multiple correct answers for single-choice question",
			severity: "error",
		});
	}

	if (question.difficulty === "Easy" && question.points > 15) {
		errors.push({
			type: "consistency",
			field: "points",
			message: "Easy question has unexpectedly high points",
			severity: "warning",
		});
	}

	if (question.difficulty === "Hard" && question.points < 25) {
		errors.push({
			type: "consistency",
			field: "points",
			message: "Hard question has unexpectedly low points",
			severity: "warning",
		});
	}

	const questionWords = question.questionText.toLowerCase().split(/\s+/).length;
	const explanationWords = (question.explanation || "")
		.toLowerCase()
		.split(/\s+/).length;

	if (explanationWords > 0 && explanationWords < questionWords * 0.3) {
		errors.push({
			type: "consistency",
			field: "explanation",
			message: "Explanation is very short compared to question",
			severity: "warning",
		});
	}

	return errors;
}

function calculateValidationScore(
	errors: ValidationError[],
	warnings: ValidationError[],
): number {
	let score = 100;

	score -= errors.filter((e) => e.severity === "error").length * 15;
	score -= warnings.filter((e) => e.severity === "warning").length * 5;

	return Math.max(0, Math.min(100, score));
}

export function filterValidQuestions(questions: QAQuestion[]): {
	questions: QAQuestion[];
	removed: QAQuestion[];
	report: { total: number; valid: number; invalid: number; avgScore: number };
} {
	const { valid, invalid } = validateQuestions(questions);
	const allResults = valid.map((q) => validateQuestion(q));
	const avgScore =
		allResults.length > 0
			? allResults.reduce((sum, r) => sum + r.score, 0) / allResults.length
			: 0;

	return {
		questions: valid,
		removed: invalid,
		report: {
			total: questions.length,
			valid: valid.length,
			invalid: invalid.length,
			avgScore: Math.round(avgScore),
		},
	};
}
