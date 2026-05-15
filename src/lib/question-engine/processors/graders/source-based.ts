import type { PromptManager } from "../../prompt-manager";
import type {
	GradingResult,
	Question,
	QuestionBody,
	UserAnswer,
} from "../../types";
import type { GradeFn, HintFn } from "../types";
import { aiGradeResult } from "./shared";

export const grade: GradeFn = (q, a, prompts) =>
	aiGradeResult(q, a, prompts, (q: Question, _a: UserAnswer) => {
		const body = q.body as QuestionBody["source-based"];
		return `Source: ${body.source.content}\nSub-questions: ${JSON.stringify(body.subQuestions)}\nStudent answers: ${JSON.stringify(_a.value)}`;
	});

export const hint: HintFn = (q) => {
	const body = q.body as QuestionBody["source-based"];
	return `Carefully read the source material. There are ${body.subQuestions.length} sub-questions to answer.`;
};
