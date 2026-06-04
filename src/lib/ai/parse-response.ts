import { logError } from "@/lib/shared/logger";
import type { AIFailure, AIResponse, AIResult } from "./types";

export function isAIFailure(result: AIResult): result is AIFailure {
	return "available" in result && !result.available;
}

export function cleanResponse(content: string): string {
	return content
		.replace(/```json\s*/g, "")
		.replace(/```\s*/g, "")
		.trim();
}

export function parseAIResponse<T>(
	result: AIResult,
	_fallback: T,
): { data: T; raw: string } | null {
	if (isAIFailure(result)) return null;
	const raw = cleanResponse((result as AIResponse).content);
	try {
		return { data: JSON.parse(raw) as T, raw };
	} catch (err) {
		logError("ParseAiResponse", err);
		return null;
	}
}

export function getTextResponse(result: AIResult): string | null {
	if (isAIFailure(result)) return null;
	return cleanResponse((result as AIResponse).content);
}

export function ensureArray<T>(parsed: T | T[]): T[] {
	return Array.isArray(parsed) ? parsed : [parsed];
}
