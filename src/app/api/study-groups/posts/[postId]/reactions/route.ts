import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { getPostReactions, togglePostReaction } from "@/lib/study-groups/service";

export const GET = createRouteHandler({
  auth: "required",
  execute: async ({ params }) => {
    const postId = params?.postId;
    if (!postId) throw new HttpError(400, "postId is required");

    const result = await getPostReactions(postId);
    if (!result.success) throw new HttpError(500, result.error ?? "Failed to fetch reactions");
    return { reactions: result.data };
  },
  errorLabel: "ReactionsGet",
});

export const POST = createRouteHandler({
  auth: "required",
  validate: (body: { emoji?: string }) => {
    if (!body.emoji || typeof body.emoji !== "string") return "Emoji is required";
    return null;
  },
  execute: async ({ body, params, userId }) => {
    const postId = params?.postId;
    if (!postId) throw new HttpError(400, "postId is required");

    const result = await togglePostReaction(userId!, postId, body.emoji!);
    if (!result.success) throw new HttpError(400, result.error ?? "Failed to toggle reaction");
    return { reaction: result.data };
  },
  errorLabel: "ReactionsPost",
});
