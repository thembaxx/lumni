import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { getAuthenticatedUserName } from "@/lib/server/auth";
import {
	createPost,
	getGroupMembers,
	getGroupPosts,
} from "@/lib/study-groups/service";

export const GET = createRouteHandler({
	auth: "required",
	errorLabel: "GroupPosts",
	execute: async ({ userId, params }) => {
		const groupId = params?.groupId as string;

		const membersResult = await getGroupMembers(groupId);
		const isMember =
			membersResult.success &&
			membersResult.data.some((m) => m.userId === userId);
		if (!isMember) {
			throw new HttpError(403, "Not a member of this group");
		}

		const result = await getGroupPosts(groupId);
		if (!result.success) {
			throw new HttpError(500, result.error);
		}
		return { posts: result.data };
	},
});

export const POST = createRouteHandler({
	auth: "required",
	errorLabel: "GroupPosts",
	execute: async ({ userId, params, req }) => {
		const groupId = params?.groupId as string;

		const membersResult = await getGroupMembers(groupId);
		const isMember =
			membersResult.success &&
			membersResult.data.some((m) => m.userId === userId);
		if (!isMember) {
			throw new HttpError(403, "Not a member of this group");
		}

		const body = await req.json();
		const userName = await getAuthenticatedUserName();

		const result = await createPost(userId as string, userName ?? undefined, {
			groupId,
			content: body.content,
			questionText: body.questionText,
			subject: body.subject,
			topic: body.topic,
		});

		if (!result.success) {
			throw new HttpError(400, result.error);
		}
		return { post: result.data };
	},
});
