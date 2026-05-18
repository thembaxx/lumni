import type { Question, QuestionBody, UserAnswer } from "../../types";
import type { HintFn } from "../types";
import { compositeGrade } from "./shared";

export const grade = compositeGrade((q: Question, _a: UserAnswer) => {
	const body = q.body as QuestionBody["mixed"];
	return `Question parts: ${JSON.stringify(body.parts.map((p) => ({ id: p.id, text: p.questionText, type: p.type, points: p.points })))}\nStudent answers: ${JSON.stringify(_a.value)}`;
});

export const hint: HintFn = (q) => {
	const body = q.body as QuestionBody["mixed"];
	return `This question has ${body.parts.length} parts. Answer each part carefully.`;
};
