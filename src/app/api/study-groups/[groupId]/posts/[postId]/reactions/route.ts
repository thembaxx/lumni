import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import {
	getGroupMembers,
	togglePostReaction,
} from "@/lib/study-groups/service";

export const POST = createRouteHandler({
	auth: "required",
	errorLabel: "PostReactions",
	validate: (body) => {
		if (!body.emoji || typeof body.emoji !== "string")
			return "Emoji is required";
		return null;
	},
	execute: async ({ userId, params, body }) => {
		const groupId = params?.groupId as string;
		const postId = params?.postId as string;

		const membersResult = await getGroupMembers(groupId);
		const isMember =
			membersResult.success &&
			membersResult.data.some((m) => m.userId === userId);
		if (!isMember) {
			throw new HttpError(403, "Not a member of this group");
		}

		const { emoji } = body as { emoji: string };
		const result = await togglePostReaction(userId as string, postId, emoji);

		if (!result.success) {
			throw new HttpError(400, result.error);
		}
		return { reaction: result.data };
	},
});
