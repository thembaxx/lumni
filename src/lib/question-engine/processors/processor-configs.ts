import { getAI } from "@/lib/ai";
import { getTextResponse, parseAIResponse } from "@/lib/ai/parse-response";
import { PromptManager } from "../prompt-manager";
import type {
	GradingResult,
	Option,
	Question,
	QuestionBody,
	UserAnswer,
} from "../types";

type GradeFn = (
	q: Question,
	a: UserAnswer,
	prompts: PromptManager,
) => GradingResult | Promise<GradingResult>;

type HintFn = (
	q: Question,
	prompts: PromptManager,
) => string | Promise<string>;

export interface ProcessorConfig {
	type: string;
	temperature: number;
	hint: HintFn;
	grade: GradeFn;
}

// ----- graders -----

function mcqGrader(q: Question, a: UserAnswer): GradingResult {
	const selectedIds = a.value as string[];
	const opts = q.body as QuestionBody["multiple-choice"];
	const correctIds = opts.options
		.filter((o: Option) => o.isCorrect)
		.map((o: Option) => o.id);
	const correct =
		selectedIds.length === correctIds.length &&
		selectedIds.every((id: string) => correctIds.includes(id));
	return {
		correct,
		score: correct ? q.points : 0,
		maxScore: q.points,
		feedback: correct
			? q.explanation
			: `The correct answer was: ${correctIds.join(", ")}. ${q.explanation}`,
	};
}

function matchingGrader(q: Question, a: UserAnswer): GradingResult {
	const pairs = q.body as QuestionBody["matching"];
	const userPairs = a.value as { left: string; right: string }[];
	let correctCount = 0;
	for (const up of userPairs) {
		if (
			pairs.pairs.some(
				(cp: { left: string; right: string }) =>
					cp.left === up.left && cp.right === up.right,
			)
		) {
			correctCount++;
		}
	}
	const score = Math.round((correctCount / pairs.pairs.length) * q.points);
	return {
		correct: correctCount === pairs.pairs.length,
		score,
		maxScore: q.points,
		feedback:
			correctCount === pairs.pairs.length
				? "All matches correct!"
				: `${correctCount}/${pairs.pairs.length} matches correct.`,
	};
}

function calcGrader(q: Question, a: UserAnswer): GradingResult {
	const body = q.body as QuestionBody["calculation"];
	const studentAnswer = a.value as { value: number; unit?: string };
	if (studentAnswer == null || studentAnswer.value == null) {
		return {
			correct: false,
			score: 0,
			maxScore: q.points,
			feedback: "No answer provided.",
		};
	}
	const numericDiff = Math.abs(studentAnswer.value - body.correctValue);
	const unitCorrect = studentAnswer.unit
		? studentAnswer.unit.toLowerCase().trim() ===
			body.unit.toLowerCase().trim()
		: true;
	const valueCorrect = numericDiff <= body.tolerance;
	if (valueCorrect && !unitCorrect) {
		return {
			correct: false,
			score: Math.round(q.points * 0.7),
			maxScore: q.points,
			feedback: `Your value is correct, but the unit should be "${body.unit}".`,
		};
	}
	return {
		correct: valueCorrect && unitCorrect,
		score: valueCorrect && unitCorrect ? q.points : 0,
		maxScore: q.points,
		feedback:
			valueCorrect && unitCorrect
				? `Correct! The answer is ${body.correctValue} ${body.unit}.`
				: `Incorrect. The correct answer is ${body.correctValue} ${body.unit} (tolerance: \u00B1${body.tolerance}).`,
	};
}

function shortAnswerGrader(
	q: Question,
	a: UserAnswer,
	prompts: PromptManager,
): Promise<GradingResult> {
	return aiGradeResult(
		q,
		a,
		prompts,
		(q: Question, _a: UserAnswer) => {
			const body = q.body as QuestionBody["short-answer"];
			return `Question: ${q.questionText}\nModel answer: ${body.modelAnswer}\nAcceptable answers: ${body.acceptableAnswers.join(" | ")}\nStudent answer: ${_a.value as string}`;
		},
		(q: Question, _a: UserAnswer) => {
			const body = q.body as QuestionBody["short-answer"];
			const student = (_a.value as string) ?? "";
			const match = body.acceptableAnswers.some(
				(ans: string) =>
					ans.toLowerCase().trim() === student.toLowerCase().trim(),
			);
			if (match) {
				return {
					correct: true,
					score: q.points,
					maxScore: q.points,
					feedback: "Correct!",
				} as GradingResult;
			}
			return null;
		},
	);
}

async function aiGradeResult(
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

function longAnswerGrader(
	q: Question,
	a: UserAnswer,
	prompts: PromptManager,
): Promise<GradingResult> {
	const student = a.value as string;
	if (!student) {
		return Promise.resolve({
			correct: false,
			score: 0,
			maxScore: q.points,
			feedback: "No answer.",
		});
	}
	const body = q.body as QuestionBody["long-answer"];
	const words = student.split(/\s+/).length;
	if (words < body.minWords) {
		return Promise.resolve({
			correct: false,
			score: 0,
			maxScore: q.points,
			feedback: `Answer too short (${words} words, minimum ${body.minWords}).`,
		});
	}
	return aiGradeResult(
		q,
		a,
		prompts,
		(q: Question, _a: UserAnswer) => {
			const b = q.body as QuestionBody["long-answer"];
			return `Question: ${q.questionText}\nRubric: ${JSON.stringify(b.rubric)}\nStudent: ${_a.value as string}`;
		},
	);
}

function essayGrader(
	q: Question,
	a: UserAnswer,
	prompts: PromptManager,
): Promise<GradingResult> {
	const student = a.value as string;
	if (!student || student.trim().length < 20) {
		return Promise.resolve({
			correct: false,
			score: 0,
			maxScore: q.points,
			feedback: "Essay is too short to grade.",
		});
	}
	return aiGradeResult(
		q,
		a,
		prompts,
		(q: Question, _a: UserAnswer) => {
			const b = q.body as QuestionBody["essay"];
			return `Question: ${q.questionText}\nRubric: ${JSON.stringify(b.rubric)}\nModel answer: ${b.modelAnswer}\nStudent essay: ${_a.value as string}`;
		},
	);
}

// ----- hinters -----

const aiHint: HintFn = async (q, prompts) => {
	const prompt = prompts.getHintPrompt(q.type);
	const ctx = `Question: ${q.questionText}`;
	const result = await getAI().generateWithSystem(
		prompt.system,
		`${prompt.user}\n\n${ctx}`,
		{ temperature: 0.5, maxTokens: 256 },
	);
	return getTextResponse(result) ?? q.hint;
};

// ----- configs -----

export const processorConfigs: ProcessorConfig[] = [
	{
		type: "multiple-choice",
		temperature: 0.8,
		grade: mcqGrader,
		hint: async (q, prompts) => {
			const prompt = prompts.getHintPrompt("multiple-choice");
			const opts = q.body as QuestionBody["multiple-choice"];
			const ctx = `Question: ${q.questionText}\nOptions: ${JSON.stringify(opts.options)}`;
			const result = await getAI().generateWithSystem(
				prompt.system,
				`${prompt.user}\n\n${ctx}`,
				{ temperature: 0.5, maxTokens: 256 },
			);
			return getTextResponse(result) ?? q.hint;
		},
	},
	{
		type: "matching",
		temperature: 0.7,
		grade: matchingGrader,
		hint: (q) => {
			const body = q.body as QuestionBody["matching"];
			return `Try matching these pairs correctly. You have ${body.pairs.length} items to match.`;
		},
	},
	{
		type: "short-answer",
		temperature: 0.7,
		grade: shortAnswerGrader,
		hint: aiHint,
	},
	{
		type: "long-answer",
		temperature: 0.8,
		grade: longAnswerGrader,
		hint: (q) => {
			const body = q.body as QuestionBody["long-answer"];
			return `Write ${body.minWords}-${body.maxWords} words covering: ${body.rubric.map((r) => r.name).join(", ")}.`;
		},
	},
	{
		type: "essay",
		temperature: 0.7,
		grade: essayGrader,
		hint: (q) => {
			const body = q.body as QuestionBody["essay"];
			return `Structure your essay around these criteria: ${body.rubric.map((r) => r.name).join(", ")}. Make sure to address each one.`;
		},
	},
	{
		type: "calculation",
		temperature: 0.6,
		grade: calcGrader,
		hint: (q) => {
			const body = q.body as QuestionBody["calculation"];
			if (q.steps && q.steps.length > 0) {
				return `Try following these steps:\n${q.steps.slice(0, 2).join("\n")}\n... then continue with the same approach.`;
			}
			return `Recall the formula: ${body.formula}. Make sure your answer includes the correct unit (${body.unit}).`;
		},
	},
	{
		type: "diagram",
		temperature: 0.7,
		grade: (q, a, p) =>
			aiGradeResult(q, a, p, (q: Question, _a: UserAnswer) => {
				const body = q.body as QuestionBody["diagram"];
				return `Question: ${q.questionText}\nDiagram: ${JSON.stringify(body.diagramData)}\nInstructions: ${body.instructions}\nStudent answer: ${JSON.stringify(_a.value)}`;
			}),
		hint: (q) => {
			const body = q.body as QuestionBody["diagram"];
			return `Look carefully at the ${body.diagramData?.title || "diagram"} and identify the key elements requested in the instructions.`;
		},
	},
	{
		type: "source-based",
		temperature: 0.7,
		grade: (q, a, p) =>
			aiGradeResult(q, a, p, (q: Question, _a: UserAnswer) => {
				const body = q.body as QuestionBody["source-based"];
				return `Source: ${body.source.content}\nSub-questions: ${JSON.stringify(body.subQuestions)}\nStudent answers: ${JSON.stringify(_a.value)}`;
			}),
		hint: (q) => {
			const body = q.body as QuestionBody["source-based"];
			return `Carefully read the source material. There are ${body.subQuestions.length} sub-questions to answer.`;
		},
	},
	{
		type: "programming",
		temperature: 0.7,
		grade: (q, a, p) => {
			const code = a.value as string;
			if (!code) {
				return Promise.resolve({
					correct: false,
					score: 0,
					maxScore: q.points,
					feedback: "No code submitted.",
				});
			}
			return aiGradeResult(q, a, p, (q: Question, _a: UserAnswer) => {
				const body = q.body as QuestionBody["programming"];
				return `Problem: ${q.questionText}\nLanguage: ${body.language}\nTest cases: ${JSON.stringify(body.testCases)}\nStudent code:\n${_a.value as string}`;
			});
		},
		hint: (q) => {
			const body = q.body as QuestionBody["programming"];
			return `Think about the algorithm first. Consider edge cases. The function should handle ${body.testCases.length} test case(s).`;
		},
	},
	{
		type: "data-response",
		temperature: 0.7,
		grade: (q, a, p) =>
			aiGradeResult(q, a, p, (q: Question, _a: UserAnswer) => {
				const body = q.body as QuestionBody["data-response"];
				return `Data: ${JSON.stringify(body.data)}\nQuestions: ${JSON.stringify(body.questions)}\nStudent answers: ${JSON.stringify(_a.value)}`;
			}),
		hint: (q) => {
			const body = q.body as QuestionBody["data-response"];
			return `Study the ${body.data.type} "${body.data.title}" carefully. There are ${body.questions.length} questions to answer based on this data.`;
		},
	},
	{
		type: "mixed",
		temperature: 0.8,
		grade: (q, a, p) =>
			aiGradeResult(q, a, p, (q: Question, _a: UserAnswer) => {
				const body = q.body as QuestionBody["mixed"];
				return `Question parts: ${JSON.stringify(body.parts.map((p) => ({ id: p.id, text: p.questionText, type: p.type, points: p.points })))}\nStudent answers: ${JSON.stringify(_a.value)}`;
			}),
		hint: (q) => {
			const body = q.body as QuestionBody["mixed"];
			return `This question has ${body.parts.length} parts. Answer each part carefully.`;
		},
	},
];
