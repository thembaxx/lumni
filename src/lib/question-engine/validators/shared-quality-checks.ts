import type { ValidationError } from "../types";

export function checkGibberish(text: string, field: string): ValidationError[] {
	const warnings: ValidationError[] = [];
	const lower = text.toLowerCase();
	if (/(.)\1{5,}/.test(lower) || /[a-z]{20,}/.test(lower.replace(/\s/g, ""))) {
		warnings.push({
			type: "quality",
			field,
			message: "Text may contain gibberish",
			severity: "warning",
		});
	}
	return warnings;
}

export function checkPlaceholders(
	text: string,
	field: string,
): ValidationError[] {
	const warnings: ValidationError[] = [];
	if (/\{\{|\}\}|<.*>|__|_+/g.test(text)) {
		warnings.push({
			type: "quality",
			field,
			message: "Contains placeholder text",
			severity: "warning",
		});
	}
	return warnings;
}

export function checkLength(
	text: string,
	field: string,
	min: number,
	max?: number,
): ValidationError[] {
	const errors: ValidationError[] = [];
	if (text.trim().length < min) {
		errors.push({
			type: "schema",
			field,
			message: `Must be at least ${min} characters`,
			severity: "error",
		});
	}
	if (max && text.length > max) {
		errors.push({
			type: "schema",
			field,
			message: `Must be at most ${max} characters`,
			severity: "warning",
		});
	}
	return errors;
}

export function checkDifficulty(
	value: string,
	field: string,
): ValidationError[] {
	const errors: ValidationError[] = [];
	if (!["Easy", "Medium", "Hard"].includes(value)) {
		errors.push({
			type: "schema",
			field,
			message: "Difficulty must be Easy, Medium, or Hard",
			severity: "error",
		});
	}
	return errors;
}

export function checkPoints(value: number, field: string): ValidationError[] {
	const errors: ValidationError[] = [];
	if (typeof value !== "number" || Number.isNaN(value) || value <= 0) {
		errors.push({
			type: "schema",
			field,
			message: "Points must be a positive number",
			severity: "error",
		});
	}
	return errors;
}
