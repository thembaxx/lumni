import type { Question, QuestionBody, UserAnswer } from "../../types";
import type { HintFn } from "../types";
import { compositeGrade } from "./shared";

export const grade = compositeGrade((q: Question, _a: UserAnswer) => {
	const body = q.body as QuestionBody["source-based"];
	return `Source: ${body.source.content}\nSub-questions: ${JSON.stringify(body.subQuestions)}\nStudent answers: ${JSON.stringify(_a.value)}`;
});

export const hint: HintFn = (q) => {
	const body = q.body as QuestionBody["source-based"];
	return `Carefully read the source material. There are ${body.subQuestions.length} sub-questions to answer.`;
};
