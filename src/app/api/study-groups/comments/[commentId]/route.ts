import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { deleteComment } from "@/lib/study-groups/service";

export const DELETE = createRouteHandler({
  auth: "required",
  errorLabel: "DeleteComment",
  execute: async ({ userId, params }) => {
    const commentId = params?.commentId as string;
    const result = await deleteComment(userId as string, commentId);

    if (!result.success) {
      throw new HttpError(400, result.error);
    }
    return { success: true };
  },
});
