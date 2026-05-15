import { createEngineHandler } from "@/lib/api/engine-handler";
import { LearningOrchestrator } from "@/lib/orchestrator";
import type { GenerationParams } from "@/lib/question-engine/types";

export const dynamic = "force-dynamic";

export const POST = createEngineHandler({
	budgetType: "generate",
	errorLabel: "Generate",
	parseBody: async (req) => {
		const body: GenerationParams = await req.json();
		return body;
	},
	validate: (body) => {
		if (!body.subject) return "Subject is required";
		if (!body.count || body.count < 1) return "Count must be at least 1";
		return null;
	},
	execute: async (body) => {
		const orchestrator = await LearningOrchestrator.initialize();
		const result = await orchestrator.generateQuestionSet(body);
		return {
			questions: result.questions,
			count: result.count,
			type: body.questionType || "any",
			jobIds: result.jobIds,
		};
	},
});
