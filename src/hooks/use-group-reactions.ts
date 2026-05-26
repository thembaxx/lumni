"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/shared/api-fetch";
import type { GroupReaction } from "@/lib/study-groups/types";

interface ReactionsResponse {
	reactions: GroupReaction[];
}

export function usePostReactions(postId: string) {
	return useQuery<GroupReaction[]>({
		queryKey: ["post-reactions", postId],
		queryFn: async () => {
			const res = await apiFetch<ReactionsResponse>(
				`/api/study-groups/posts/${postId}/reactions`,
				{},
			);
			return res.reactions;
		},
	});
}

export function useTogglePostReaction(postId: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (emoji: string) => {
			const res = await apiFetch<{ reaction: GroupReaction | null }>(
				`/api/study-groups/posts/${postId}/reactions`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ emoji }),
				},
			);
			return res.reaction;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["post-reactions", postId] });
		},
	});
}

export function useCommentReactions(commentId: string) {
	return useQuery<GroupReaction[]>({
		queryKey: ["comment-reactions", commentId],
		queryFn: async () => {
			const res = await apiFetch<ReactionsResponse>(
				`/api/study-groups/comments/${commentId}/reactions`,
				{},
			);
			return res.reactions;
		},
	});
}

export function useToggleCommentReaction(commentId: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (emoji: string) => {
			const res = await apiFetch<{ reaction: GroupReaction | null }>(
				`/api/study-groups/comments/${commentId}/reactions`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ emoji }),
				},
			);
			return res.reaction;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["comment-reactions", commentId],
			});
		},
	});
}
