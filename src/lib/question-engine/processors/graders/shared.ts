import { getAI } from "@/lib/ai";
import { getTextResponse, parseAIResponse } from "@/lib/ai/parse-response";
import type { PromptManager } from "../../prompt-manager";
import type {
	GradingResult,
	Question,
	QuestionBody,
	UserAnswer,
} from "../../types";
import type { GradeFn, HintFn } from "../types";

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

const compositeGrade = (
	ctxBuilder: (q: Question, _a: UserAnswer) => string,
): GradeFn => {
	return (q, a, prompts) => aiGradeResult(q, a, prompts, ctxBuilder);
};

/* Consolidated graders for types that delegate directly to compositeGrade */

export const gradeDataResponse = compositeGrade((q, _a) => {
	const body = q.body as QuestionBody["data-response"];
	return `Data: ${JSON.stringify(body.data)}\nQuestions: ${JSON.stringify(body.questions)}\nStudent answers: ${JSON.stringify(_a.value)}`;
});

export const hintDataResponse: HintFn = (q) => {
	const body = q.body as QuestionBody["data-response"];
	return `Study the ${body.data.type} "${body.data.title}" carefully. There are ${body.questions.length} questions to answer based on this data.`;
};

export const gradeDiagram = compositeGrade((q, _a) => {
	const body = q.body as QuestionBody["diagram"];
	return `Question: ${q.questionText}\nDiagram: ${JSON.stringify(body.diagramData)}\nInstructions: ${body.instructions}\nStudent answer: ${JSON.stringify(_a.value)}`;
});

export const hintDiagram: HintFn = (q) => {
	const body = q.body as QuestionBody["diagram"];
	return `Look carefully at the ${body.diagramData?.title || "diagram"} and identify the key elements requested in the instructions.`;
};

export const gradeMixed = compositeGrade((q, _a) => {
	const body = q.body as QuestionBody["mixed"];
	return `Question parts: ${JSON.stringify(body.parts.map((p) => ({ id: p.id, text: p.questionText, type: p.type, points: p.points })))}\nStudent answers: ${JSON.stringify(_a.value)}`;
});

export const hintMixed: HintFn = (q) => {
	const body = q.body as QuestionBody["mixed"];
	return `This question has ${body.parts.length} parts. Answer each part carefully.`;
};

export const gradeSourceBased = compositeGrade((q, _a) => {
	const body = q.body as QuestionBody["source-based"];
	return `Source: ${body.source.content}\nSub-questions: ${JSON.stringify(body.subQuestions)}\nStudent answers: ${JSON.stringify(_a.value)}`;
});

export const hintSourceBased: HintFn = (q) => {
	const body = q.body as QuestionBody["source-based"];
	return `Carefully read the source material. There are ${body.subQuestions.length} sub-questions to answer.`;
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
