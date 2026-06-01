import { createRouteHandler } from "@/lib/api/create-route-handler";
import { enqueue } from "@/lib/orchestrator/job-queue";

const VALID_REASONS = ["wrong", "offensive", "broken", "other"];

export const POST = createRouteHandler({
	auth: "required",
	errorLabel: "FlagQuestion",
	validate: (body) => {
		if (!body.questionId || !body.reason)
			return "questionId and reason are required";
		if (!VALID_REASONS.includes(body.reason as string))
			return `reason must be one of: ${VALID_REASONS.join(", ")}`;
		return null;
	},
	execute: async ({ userId, body }) => {
		const { questionId, reason, details } = body as {
			questionId: string;
			reason: string;
			details?: string;
		};

		await enqueue("appwrite-question-flag", {
			questionId,
			userId: userId as string,
			reason,
			details: details || "",
			createdAt: Date.now(),
		});

		return { success: true };
	},
});
