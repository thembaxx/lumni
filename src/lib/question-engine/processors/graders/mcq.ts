import { getAI } from "@/lib/ai";
import { getTextResponse } from "@/lib/ai/parse-response";
import type { Option, QuestionBody } from "../../types";
import type { GradeFn, HintFn } from "../types";

export const grade: GradeFn = (q, a) => {
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
};

export const hint: HintFn = async (q, prompts) => {
	const prompt = prompts.getHintPrompt("multiple-choice");
	const opts = q.body as QuestionBody["multiple-choice"];
	const ctx = `Question: ${q.questionText}\nOptions: ${JSON.stringify(opts.options)}`;
	const result = await getAI().generateWithSystem(
		prompt.system,
		`${prompt.user}\n\n${ctx}`,
		{ temperature: 0.5, maxTokens: 256 },
	);
	return getTextResponse(result) ?? q.hint;
};
