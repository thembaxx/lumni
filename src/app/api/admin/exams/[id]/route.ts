import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/client";
import { databases } from "@/lib/server/appwrite";

export const DELETE = createRouteHandler({
	auth: "admin",
	execute: async ({ params }) => {
		const id = params?.id;
		if (!id) throw new HttpError(400, "Missing exam paper ID");

		await databases.deleteDocument(
			APPWRITE_DATABASE_ID,
			COLLECTIONS.EXAM_PAPERS,
			id,
		);

		return { success: true };
	},
	errorLabel: "Delete exam paper",
});
