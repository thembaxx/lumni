import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { getAuthenticatedUserName } from "@/lib/server/auth";
import { createComment, getPostComments } from "@/lib/study-groups/service";

export const GET = createRouteHandler({
	auth: "required",
	errorLabel: "PostComments",
	execute: async ({ params }) => {
		const postId = params?.postId as string;
		const result = await getPostComments(postId);

		if (!result.success) {
			throw new HttpError(500, result.error);
		}
		return { comments: result.data };
	},
});

export const POST = createRouteHandler({
	auth: "required",
	errorLabel: "PostComments",
	validate: (body) => {
		if (!body.content || typeof body.content !== "string")
			return "Content is required";
		return null;
	},
	execute: async ({ userId, params, body }) => {
		const postId = params?.postId as string;
		const { content, parentId } = body as {
			content: string;
			parentId?: string;
		};

		const userName = await getAuthenticatedUserName();
		const result = await createComment(
			userId as string,
			userName ?? undefined,
			postId,
			content,
			parentId,
		);

		if (!result.success) {
			throw new HttpError(400, result.error);
		}
		return { comment: result.data };
	},
});
