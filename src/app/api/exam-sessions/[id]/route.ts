import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { databases } from "@/lib/appwrite.server";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/client";

export const GET = createRouteHandler({
	auth: "required",
	execute: async ({ userId, params }) => {
		const id = params?.id;
		if (!id) throw new HttpError(400, "Missing exam session ID");

		const doc = await databases.getDocument(
			APPWRITE_DATABASE_ID,
			COLLECTIONS.EXAM_SESSIONS,
			id,
		);

		if (!doc) throw new HttpError(404, "Exam session not found");
		if ((doc as Record<string, unknown>).userId !== userId) {
			throw new HttpError(403, "Unauthorized");
		}

		return {
			id: doc.$id,
			examId: (doc as Record<string, unknown>).examId,
			subject: (doc as Record<string, unknown>).subject,
			status: (doc as Record<string, unknown>).status,
			answers: (doc as Record<string, unknown>).answers,
			score: (doc as Record<string, unknown>).score,
			startedAt: (doc as Record<string, unknown>).startedAt,
			completedAt: (doc as Record<string, unknown>).completedAt,
		};
	},
	errorLabel: "Get exam session",
});

export const DELETE = createRouteHandler({
	auth: "required",
	execute: async ({ userId, params }) => {
		const id = params?.id;
		if (!id) throw new HttpError(400, "Missing exam session ID");

		const doc = await databases.getDocument(
			APPWRITE_DATABASE_ID,
			COLLECTIONS.EXAM_SESSIONS,
			id,
		);

		if (!doc) throw new HttpError(404, "Exam session not found");
		if ((doc as Record<string, unknown>).userId !== userId) {
			throw new HttpError(403, "Unauthorized");
		}

		await databases.deleteDocument(
			APPWRITE_DATABASE_ID,
			COLLECTIONS.EXAM_SESSIONS,
			id,
		);

		return { success: true };
	},
	errorLabel: "Delete exam session",
});
