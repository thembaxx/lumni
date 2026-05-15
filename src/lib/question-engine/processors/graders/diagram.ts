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
		const body = q.body as QuestionBody["diagram"];
		return `Question: ${q.questionText}\nDiagram: ${JSON.stringify(body.diagramData)}\nInstructions: ${body.instructions}\nStudent answer: ${JSON.stringify(_a.value)}`;
	});

export const hint: HintFn = (q) => {
	const body = q.body as QuestionBody["diagram"];
	return `Look carefully at the ${body.diagramData?.title || "diagram"} and identify the key elements requested in the instructions.`;
};
