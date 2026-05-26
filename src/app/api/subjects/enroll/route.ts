import { Query } from "appwrite";
import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import {
	COLLECTIONS,
	createDocument,
	deleteDocument,
	listDocuments,
} from "@/lib/db/client";

interface EnrollBody {
	subjectIds: string[];
}

export const POST = createRouteHandler<EnrollBody>({
	auth: "required",
	useRateLimit: true,
	validate: (body) => {
		if (!Array.isArray(body.subjectIds)) {
			return "subjectIds must be an array";
		}
		if (body.subjectIds.length > 48) {
			return "Too many subjects (max 48)";
		}
		return null;
	},
	execute: async ({ body, userId }) => {
		if (!userId) throw new HttpError(401, "Not authenticated");

		const existing = await listDocuments<{ $id: string }>(
			COLLECTIONS.USER_SUBJECTS,
			[Query.equal("userId", userId)],
		);

		await Promise.all(
			existing.map((doc) => deleteDocument(COLLECTIONS.USER_SUBJECTS, doc.$id)),
		);

		if (body.subjectIds.length > 0) {
			await Promise.all(
				body.subjectIds.map((subjectId) =>
					createDocument(COLLECTIONS.USER_SUBJECTS, {
						userId,
						subjectId,
						selectedAt: new Date().toISOString(),
					}),
				),
			);
		}

		return { success: true, count: body.subjectIds.length };
	},
	errorLabel: "Subject Enrollment",
});
