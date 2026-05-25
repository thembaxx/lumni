"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/shared/api-fetch";
import type { GroupComment } from "@/lib/study-groups/types";

interface CommentsResponse {
	comments: GroupComment[];
}

interface PostReactionsResponse {
	reactions: GroupComment[];
}

export function useGroupComments(groupId: string, postId: string) {
	return useQuery<GroupComment[]>({
		queryKey: ["group-comments", postId],
		queryFn: async () => {
			const res = await apiFetch<CommentsResponse>(
				`/api/study-groups/${groupId}/posts/${postId}/comments`,
				{},
			);
			return res.comments;
		},
	});
}

export function useCreateComment(groupId: string, postId: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: {
			content: string;
			parentId?: string;
		}) => {
			const res = await apiFetch<{ comment: GroupComment }>(
				`/api/study-groups/${groupId}/posts/${postId}/comments`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(input),
				},
			);
			return res.comment;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["group-comments", postId] });
		},
	});
}

export function useDeleteComment(postId: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (commentId: string) => {
			await apiFetch<{ success: boolean }>(
				`/api/study-groups/comments/${commentId}`,
				{ method: "DELETE" },
			);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["group-comments", postId] });
		},
	});
}
