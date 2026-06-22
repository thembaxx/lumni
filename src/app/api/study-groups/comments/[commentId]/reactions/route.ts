import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { getCommentReactions, toggleCommentReaction } from "@/lib/study-groups/service";

export const GET = createRouteHandler({
  auth: "required",
  errorLabel: "CommentReactions",
  execute: async ({ params }) => {
    const commentId = params?.commentId as string;
    const result = await getCommentReactions(commentId);

    if (!result.success) {
      throw new HttpError(500, result.error);
    }
    return { reactions: result.data };
  },
});

export const POST = createRouteHandler({
  auth: "required",
  errorLabel: "CommentReactions",
  validate: (body) => {
    if (!body.emoji || typeof body.emoji !== "string") return "Emoji is required";
    return null;
  },
  execute: async ({ userId, params, body }) => {
    const commentId = params?.commentId as string;
    const { emoji } = body as { emoji: string };
    const result = await toggleCommentReaction(userId as string, commentId, emoji);

    if (!result.success) {
      throw new HttpError(400, result.error);
    }
    return { reaction: result.data };
  },
});
