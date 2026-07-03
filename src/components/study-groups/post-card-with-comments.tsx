"use client";

import { useCallback } from "react";
import { useCreateComment, useDeleteComment, useGroupComments } from "@/hooks/use-group-comments";
import { usePostReactions, useTogglePostReaction } from "@/hooks/use-group-reactions";
import type { GroupPost } from "@/lib/study-groups/types";
import { PostCard } from "./post-card";

interface Props {
  post: GroupPost;
  groupId: string;
  onPin?: () => void;
}

export function PostCardWithComments({ post, groupId, onPin }: Props) {
  const { data: comments } = useGroupComments({ groupId, postId: post.$id });
  const { data: reactions } = usePostReactions(post.$id);
  const { mutate: createComment } = useCreateComment();
  const { mutate: deleteComment } = useDeleteComment();
  const { mutate: toggleReaction } = useTogglePostReaction();

  const handleToggleReaction = useCallback(
    (_postId: string, emoji: string) => {
      toggleReaction({ postId: post.$id, emoji });
    },
    [toggleReaction, post.$id],
  );

  const handleCreateComment = useCallback(
    (_postId: string, content: string, parentId?: string) => {
      createComment({ groupId, postId: post.$id, content, parentId });
    },
    [createComment, groupId, post.$id],
  );

  return (
    <PostCard
      post={post}
      groupId={groupId}
      comments={comments}
      reactions={reactions}
      onToggleReaction={handleToggleReaction}
      onCreateComment={handleCreateComment}
      onDeleteComment={(commentId) => deleteComment({ postId: post.$id, commentId })}
      onPin={onPin}
    />
  );
}
