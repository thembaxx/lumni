import { getAI } from "@/lib/ai";
import { getTextResponse, parseAIResponse } from "@/lib/ai/parse-response";
import type { PromptManager } from "../../prompt-manager";
import type { GradingResult, Question, UserAnswer } from "../../types";
import type { GradeFn } from "../types";

export async function aiGradeResult(
	q: Question,
	a: UserAnswer,
	prompts: PromptManager,
	ctxBuilder: (q: Question, a: UserAnswer) => string,
	fallback?: (q: Question, a: UserAnswer) => GradingResult | null,
): Promise<GradingResult> {
	if (!a.value || (Array.isArray(a.value) && a.value.length === 0)) {
		return {
			correct: false,
			score: 0,
			maxScore: q.points,
			feedback: "No answer provided.",
		};
	}
	const ctx = ctxBuilder(q, a);
	const prompt = prompts.getGradePrompt(q.type);
	const result = await getAI().generateWithSystem(
		prompt.system,
		`${prompt.user}\n\n${ctx}`,
		{ temperature: 0.2, maxTokens: 1024 },
	);
	const parsed = parseAIResponse<{
		correct: boolean;
		score?: number;
		maxScore?: number;
		feedback?: string;
		breakdown?: GradingResult["breakdown"];
	}>(result, { correct: false });
	if (parsed) {
		return {
			correct: parsed.data.correct,
			score: parsed.data.score ?? (parsed.data.correct ? q.points : 0),
			maxScore: parsed.data.maxScore ?? q.points,
			feedback: parsed.data.feedback ?? "",
			breakdown: parsed.data.breakdown,
		};
	}
	if (fallback) {
		const fb = fallback(q, a);
		if (fb) return fb;
	}
	return {
		correct: false,
		score: 0,
		maxScore: q.points,
		feedback: "Unable to grade.",
	};
}

export const compositeGrade = (
	ctxBuilder: (q: Question, _a: UserAnswer) => string,
): GradeFn => {
	return (q, a, prompts) => aiGradeResult(q, a, prompts, ctxBuilder);
};

export const aiHintFactory = (): ((
	q: Question,
	prompts: PromptManager,
) => Promise<string>) => {
	return async (q, prompts) => {
		const prompt = prompts.getHintPrompt(q.type);
		const ctx = `Question: ${q.questionText}`;
		const result = await getAI().generateWithSystem(
			prompt.system,
			`${prompt.user}\n\n${ctx}`,
			{ temperature: 0.5, maxTokens: 256 },
		);
		return getTextResponse(result) ?? q.hint;
	};
};
