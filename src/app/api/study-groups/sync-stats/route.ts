import { createRouteHandler } from "@/lib/api/create-route-handler";
import { COLLECTIONS, listDocuments, updateDocument } from "@/lib/db/client";
import type { GroupMember } from "@/lib/study-groups/types";

export const POST = createRouteHandler({
	auth: "required",
	errorLabel: "SyncStats",
	execute: async ({ userId, body }) => {
		const { questionsAnswered, currentStreak } = body as {
			questionsAnswered?: number;
			currentStreak?: number;
		};

		const memberships = await listDocuments<GroupMember>(
			COLLECTIONS.GROUP_MEMBERS,
			[`userId=${userId}`],
		);

		await Promise.all(
			memberships.map((m) =>
				updateDocument(COLLECTIONS.GROUP_MEMBERS, m.$id, {
					...(questionsAnswered !== undefined && { questionsAnswered }),
					...(currentStreak !== undefined && { currentStreak }),
				}),
			),
		);

		return { success: true, synced: memberships.length };
	},
});
