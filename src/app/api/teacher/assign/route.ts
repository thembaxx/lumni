import { createRouteHandler } from "@/lib/api/create-route-handler";
import { COLLECTIONS, createDocument } from "@/lib/db/client";

export const POST = createRouteHandler({
	auth: "required",
	errorLabel: "TeacherAssign",
	validate: (body) => {
		if (!body.topics || !Array.isArray(body.topics) || body.topics.length === 0)
			return "topics required";
		return null;
	},
	execute: async ({ userId, body }) => {
		const { topics } = body as { topics: string[] };

		await createDocument(COLLECTIONS.TEACHER_ASSIGNMENTS, {
			teacherId: userId,
			topicIds: JSON.stringify(topics),
			status: "pending",
			createdAt: new Date().toISOString(),
		});
		return { success: true, topics };
	},
});
