import { Query } from "appwrite";
import { createRouteHandler } from "@/lib/api/create-route-handler";
import { databases } from "@/lib/appwrite.server";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/client";
import { logError } from "@/lib/shared/logger";

export const POST = createRouteHandler({
	auth: "none",
	execute: async () => {
		const token = crypto.randomUUID();
		const link = {
			token,
			teacherId: "ghost",
			createdAt: Date.now(),
			expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
			revoked: false,
		};
		try {
			await databases.createDocument(
				APPWRITE_DATABASE_ID,
				COLLECTIONS.GHOST_LINKS,
				token,
				link,
			);
		} catch (e) {
			logError("GhostLinkCreate", e);
		}
		return {
			token,
			url: `/ghost/${token}`,
			expiresAt: link.expiresAt,
		};
	},
	errorLabel: "GhostLink",
});

export const DELETE = createRouteHandler({
	auth: "none",
	execute: async ({ body }: { body: { token?: string } }) => {
		if (body.token) {
			try {
				const docs = await databases.listDocuments(
					APPWRITE_DATABASE_ID,
					COLLECTIONS.GHOST_LINKS,
					[Query.equal("token", body.token)],
				);
				if (docs.documents.length > 0) {
					await databases.deleteDocument(
						APPWRITE_DATABASE_ID,
						COLLECTIONS.GHOST_LINKS,
						docs.documents[0].$id,
					);
				}
			} catch (e) {
				logError("GhostLinkDelete", e);
			}
		}
		return { success: true };
	},
	errorLabel: "GhostLink",
});
