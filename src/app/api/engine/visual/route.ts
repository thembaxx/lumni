import { createEngineHandler } from "@/lib/api/engine-handler";
import { VisualEngine, visualEngine } from "@/lib/visual-engine";

export const dynamic = "force-dynamic";

export const POST = createEngineHandler({
	budgetType: "visual",
	errorLabel: "Visual",
	parseBody: async (req) => {
		const body: {
			questionId: string;
			questionText: string;
			subject: string;
			topic?: string;
		} = await req.json();
		return body;
	},
	validate: (body) => {
		if (!body.questionId || !body.questionText || !body.subject)
			return "questionId, questionText, and subject are required";
		return null;
	},
	execute: async (body) => {
		VisualEngine.initialize();
		const visual = await visualEngine.resolve({
			questionId: body.questionId,
			questionText: body.questionText,
			subject: body.subject,
			topic: body.topic || "",
		});
		return { visual };
	},
});
