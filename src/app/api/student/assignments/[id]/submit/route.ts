import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { SubmissionService } from "@/lib/assignments/submission-service";

export const POST = createRouteHandler({
	auth: "required",
	errorLabel: "StudentAssignmentSubmit",
	validate: (body: Record<string, unknown>) => {
		if (!body.answers || typeof body.answers !== "object")
			return "answers object is required";
		if (!body.subject || typeof body.subject !== "string")
			return "subject is required";
		return null;
	},
	execute: async ({ userId, body, params }) => {
		const assignmentId = params?.id as string;
		const { answers, subject, topic } = body as {
			answers: Record<string, unknown>;
			subject: string;
			topic?: string;
		};

		const service = new SubmissionService();
		try {
			return await service.submit(
				assignmentId,
				userId as string,
				answers,
				subject,
				topic,
			);
		} catch (err) {
			throw new HttpError(
				err instanceof Error && err.message === "Assignment not found"
					? 404
					: 500,
				err instanceof Error ? err.message : "Submission failed",
			);
		}
	},
});
