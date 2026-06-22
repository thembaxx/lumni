"use client";

import type { GroupComment } from "@/lib/study-groups/types";
import { createApiQuery, createInvalidatingMutation } from "./use-hook-factories";

interface CommentsResponse {
  comments: GroupComment[];
}

export const useGroupComments = createApiQuery<GroupComment[], { groupId: string; postId: string }>(
  {
    queryKey: ({ postId }) => ["group-comments", postId],
    fetchFn: async ({ groupId, postId }) => {
      const res = await fetch(`/api/study-groups/${groupId}/posts/${postId}/comments`);
      if (!res.ok) throw new Error("Failed to fetch comments");
      const data = (await res.json()) as CommentsResponse;
      return data.comments;
    },
  },
);

interface CreateCommentInput {
  groupId: string;
  postId: string;
  content: string;
  parentId?: string;
}

export const useCreateComment = createInvalidatingMutation<
  CreateCommentInput,
  { comment: GroupComment },
  GroupComment
>({
  endpoint: (input) => `/api/study-groups/${input.groupId}/posts/${input.postId}/comments`,
  invalidateKey: (input) => ["group-comments", input.postId],
  transformResponse: (res) => res.comment,
});

interface DeleteCommentInput {
  postId: string;
  commentId: string;
}

export const useDeleteComment = createInvalidatingMutation<
  DeleteCommentInput,
  { success: boolean },
  void
>({
  endpoint: (input) => `/api/study-groups/comments/${input.commentId}`,
  method: "DELETE",
  invalidateKey: (input) => ["group-comments", input.postId],
  transformResponse: () => undefined,
});
