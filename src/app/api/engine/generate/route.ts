import { createRouteHandler } from "@/lib/api/create-route-handler";
import { LearningOrchestrator } from "@/lib/orchestrator";
import type { GenerationParams } from "@/lib/question-engine/types";

export const dynamic = "force-dynamic";

export const POST = createRouteHandler({
	auth: "none",
	budget: "generate",
	errorLabel: "Generate",
	useRateLimit: true,
	aiContext: { consentGranted: true },
	parseBody: async (req) => {
		const body: GenerationParams = await req.json();
		return body;
	},
	validate: (body) => {
		if (!body.subject) return "Subject is required";
		if (!body.count || body.count < 1) return "Count must be at least 1";
		return null;
	},
	execute: async ({ body, userId }) => {
		const orchestrator = await LearningOrchestrator.initialize();
		const result = await orchestrator.generateQuestionSet({
			...body,
			userId: userId ?? null,
		});
		const requested = body.count;
		const delivered = result.questions.length;

		try {
			const { enqueue } = await import("@/lib/orchestrator/job-queue");
			await enqueue("prune-stale-questions", {}, { priority: 10 });
		} catch (e) {
			console.warn("[Prune] Failed to enqueue prune job:", e);
		}

		return {
			questions: result.questions,
			count: delivered,
			requested,
			type: body.questionType || "any",
			jobIds: result.jobIds,
			partial: delivered < requested,
			warning:
				delivered < requested
					? `Only ${delivered} of ${requested} questions could be generated.`
					: undefined,
			sources: result.sources ?? [],
		};
	},
});
