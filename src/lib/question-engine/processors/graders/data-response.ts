import type { Question, QuestionBody, UserAnswer } from "../../types";
import type { HintFn } from "../types";
import { compositeGrade } from "./shared";

export const grade = compositeGrade((q: Question, _a: UserAnswer) => {
	const body = q.body as QuestionBody["data-response"];
	return `Data: ${JSON.stringify(body.data)}\nQuestions: ${JSON.stringify(body.questions)}\nStudent answers: ${JSON.stringify(_a.value)}`;
});

export const hint: HintFn = (q) => {
	const body = q.body as QuestionBody["data-response"];
	return `Study the ${body.data.type} "${body.data.title}" carefully. There are ${body.questions.length} questions to answer based on this data.`;
};
