import type { PromptManager } from "../../prompt-manager";
import type {
	GradingResult,
	Question,
	QuestionBody,
	UserAnswer,
} from "../../types";
import type { GradeFn, HintFn } from "../types";
import { aiGradeResult, aiHintFactory } from "./shared";

export const grade: GradeFn = (q, a, prompts) => {
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
};

export const hint: HintFn = aiHintFactory();
