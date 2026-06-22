"use client";

import type { GroupReaction } from "@/lib/study-groups/types";
import { createApiQuery, createInvalidatingMutation } from "./use-hook-factories";

interface ReactionsResponse {
  reactions: GroupReaction[];
}

export const usePostReactions = createApiQuery<GroupReaction[], string>({
  queryKey: (postId) => ["post-reactions", postId],
  fetchFn: async (postId) => {
    const res = await fetch(`/api/study-groups/posts/${postId}/reactions`);
    if (!res.ok) throw new Error("Failed to fetch reactions");
    const data = (await res.json()) as ReactionsResponse;
    return data.reactions;
  },
});

interface ToggleReactionInput {
  postId: string;
  emoji: string;
}

export const useTogglePostReaction = createInvalidatingMutation<
  ToggleReactionInput,
  { reaction: GroupReaction | null },
  GroupReaction | null
>({
  endpoint: (input) => `/api/study-groups/posts/${input.postId}/reactions`,
  invalidateKey: (input) => ["post-reactions", input.postId],
  bodySerializer: (input) => ({ emoji: input.emoji }),
  transformResponse: (res) => res.reaction,
});
