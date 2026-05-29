import { createRouteHandler } from "@/lib/api/create-route-handler";
import { LearningOrchestrator } from "@/lib/orchestrator";
import type { Question, UserAnswer } from "@/lib/question-engine/types";

export const dynamic = "force-dynamic";

export const POST = createRouteHandler({
	auth: "none",
	budget: "grade",
	errorLabel: "Grade",
	useRateLimit: true,
	parseBody: async (req) => {
		const body: { question: Question; answer: UserAnswer } = await req.json();
		return body;
	},
	validate: (body) => {
		if (!body.question || !body.answer)
			return "Question and answer are required";
		return null;
	},
	execute: async ({ body }) => {
		const orchestrator = await LearningOrchestrator.initialize();
		const { result, jobIds } = await orchestrator.gradeAndTrack(
			body.question,
			body.answer,
		);
		return { ...result, jobIds };
	},
});
