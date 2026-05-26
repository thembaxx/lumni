"use client";

import { useCallback } from "react";
import {
	useCreateComment,
	useDeleteComment,
	useGroupComments,
} from "@/hooks/use-group-comments";
import {
	usePostReactions,
	useTogglePostReaction,
} from "@/hooks/use-group-reactions";
import type { GroupPost } from "@/lib/study-groups/types";
import { PostCard } from "./post-card";

interface Props {
	post: GroupPost;
	groupId: string;
}

export function PostCardWithComments({ post, groupId }: Props) {
	const { data: comments } = useGroupComments(groupId, post.$id);
	const { data: reactions } = usePostReactions(post.$id);
	const { mutate: createComment } = useCreateComment(groupId, post.$id);
	const { mutate: deleteComment } = useDeleteComment(post.$id);
	const { mutate: toggleReaction } = useTogglePostReaction(post.$id);

	const handleToggleReaction = useCallback(
		(_postId: string, emoji: string) => {
			toggleReaction(emoji);
		},
		[toggleReaction],
	);

	const handleCreateComment = useCallback(
		(_postId: string, content: string, parentId?: string) => {
			createComment({ content, parentId });
		},
		[createComment],
	);

	return (
		<PostCard
			post={post}
			groupId={groupId}
			comments={comments}
			reactions={reactions}
			onToggleReaction={handleToggleReaction}
			onCreateComment={handleCreateComment}
			onDeleteComment={(commentId) => deleteComment(commentId)}
		/>
	);
}
