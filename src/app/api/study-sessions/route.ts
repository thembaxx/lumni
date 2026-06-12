import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/client";
import { databases } from "@/lib/server/appwrite";

export const POST = createRouteHandler({
	auth: "optional",
	errorLabel: "StudySessions",
	validate: (body) => {
		if (!body.subject) return "subject is required";
		return null;
	},
	execute: async ({ userId, body }) => {
		if (!APPWRITE_DATABASE_ID) {
			throw new HttpError(500, "Configuration error: Database ID missing");
		}

		const { subject, questionsAnswered, correctCount, duration } = body as {
			subject: string;
			questionsAnswered?: number;
			correctCount?: number;
			duration?: number;
		};

		const now = new Date().toISOString();

		await databases.createDocument(
			APPWRITE_DATABASE_ID,
			COLLECTIONS.STUDY_SESSIONS,
			"unique()",
			{
				userId: userId || "anonymous",
				subjectId: subject,
				questionsAnswered: questionsAnswered ?? 0,
				correctCount: correctCount ?? 0,
				duration: duration ?? 0,
				startedAt: now,
				endedAt: now,
			},
		);

		return { success: true };
	},
});
