import { createRouteHandler } from "@/lib/api/create-route-handler";
import { QuestionEngine } from "@/lib/question-engine/question-engine";
import type { Question } from "@/lib/question-engine/types";

export const dynamic = "force-dynamic";

export const POST = createRouteHandler({
	auth: "none",
	budget: "hint",
	errorLabel: "Hint",
	useRateLimit: true,
	parseBody: async (req) => {
		const body: { question: Question } = await req.json();
		return body;
	},
	validate: (body) => {
		if (!body.question?.id) return "Question is required";
		return null;
	},
	execute: async ({ body }) => {
		const engine = await QuestionEngine.initialize();
		const hint = await engine.generateHint({
			questionId: body.question.id,
			question: body.question,
		});
		return { hint };
	},
});
