import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { deletePost } from "@/lib/study-groups/service";

export const DELETE = createRouteHandler({
	auth: "required",
	errorLabel: "DeletePost",
	execute: async ({ userId, params }) => {
		const postId = params?.postId as string;
		const result = await deletePost(userId as string, postId);

		if (!result.success) {
			throw new HttpError(400, result.error);
		}
		return { success: true };
	},
});
