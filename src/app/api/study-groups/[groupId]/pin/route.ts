import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { pinPost, unpinPost } from "@/lib/study-groups/service";

export const POST = createRouteHandler({
  auth: "required",
  errorLabel: "PinPost",
  execute: async ({ userId, params, body }) => {
    const groupId = params?.groupId as string;
    const { postId } = body as { postId: string };
    if (!postId) throw new HttpError(400, "postId is required");

    const result = await pinPost(userId as string, groupId, postId);
    if (!result.success) {
      throw new HttpError(400, result.error);
    }
    return { success: true };
  },
});

export const DELETE = createRouteHandler({
  auth: "required",
  errorLabel: "UnpinPost",
  execute: async ({ userId, params, body }) => {
    const groupId = params?.groupId as string;
    const { postId } = body as { postId: string };
    if (!postId) throw new HttpError(400, "postId is required");

    const result = await unpinPost(userId as string, groupId, postId);
    if (!result.success) {
      throw new HttpError(400, result.error);
    }
    return { success: true };
  },
});
