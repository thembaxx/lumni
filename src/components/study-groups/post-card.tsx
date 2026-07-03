"use client";

import Delete02Icon from "@hugeicons/core-free-icons/Delete02Icon";
import Message01Icon from "@hugeicons/core-free-icons/Message01Icon";
import Pin02Icon from "@hugeicons/core-free-icons/Pin02Icon";
import UserIcon from "@hugeicons/core-free-icons/UserIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDeletePost } from "@/hooks/use-study-groups";
import { useAuth } from "@/lib/auth/auth-context";
import type { GroupComment, GroupPost, GroupReaction } from "@/lib/study-groups/types";
import { cn } from "@/lib/utils";
import { CommentForm } from "./comment-form";
import { CommentThread } from "./comment-thread";
import { ReactionBar } from "./reaction-bar";

interface Props {
  post: GroupPost;
  groupId: string;
  comments?: GroupComment[];
  reactions?: GroupReaction[];
  onToggleReaction?: (postId: string, emoji: string) => void;
  onCreateComment?: (postId: string, content: string, parentId?: string) => void;
  onDeleteComment?: (commentId: string) => void;
  onPin?: () => void;
}

export function PostCard({
  post,
  groupId: _groupId,
  comments,
  reactions,
  onToggleReaction,
  onCreateComment,
  onDeleteComment,
  onPin,
}: Props) {
  const { user } = useAuth();
  const { mutate: deletePost } = useDeletePost();
  const isOwner = user?.$id === post.userId;
  const [showComments, setShowComments] = useState(false);

  const aggregatedReactions = useMemo(() => {
    const postReactions = (reactions ?? []).filter((r) => r.postId === post.$id);
    const map = new Map<string, { emoji: string; userId: string; count: number }>();
    for (const r of postReactions) {
      const existing = map.get(r.emoji);
      if (existing) {
        existing.count++;
      } else {
        map.set(r.emoji, { emoji: r.emoji, userId: r.userId, count: 1 });
      }
    }
    return [...map.values()];
  }, [reactions, post.$id]);

  const commentCount = (comments ?? []).length;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border/50 bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-full bg-muted">
            <HugeiconsIcon icon={UserIcon} className="size-3.5" />
          </div>
          <span className="font-medium text-sm">{post.userName || post.userId}</span>
          <span className="text-muted-foreground text-xs">
            {format(new Date(post.createdAt), "MMM d, HH:mm")}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {onPin && (
            <button
              type="button"
              onClick={onPin}
              className="relative flex size-7 items-center justify-center text-muted-foreground hover:text-foreground after:absolute after:-inset-2"
              aria-label={post.isPinned ? "Unpin post" : "Pin post"}
              title={post.isPinned ? "Unpin post" : "Pin post"}
            >
              <HugeiconsIcon
                icon={Pin02Icon}
                className={`size-3.5 ${post.isPinned ? "text-primary" : ""}`}
              />
            </button>
          )}
          {isOwner && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="relative size-7 text-muted-foreground hover:text-destructive after:absolute after:-inset-2"
              onClick={() => deletePost(post.$id)}
              aria-label="Delete post"
            >
              <HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
            </Button>
          )}
        </div>
      </div>

      {post.questionText && (
        <div className="overflow-wrap-anywhere rounded-md bg-muted/50 px-3 py-2 text-muted-foreground text-sm italic">
          {post.questionText}
        </div>
      )}

      <p className="overflow-wrap-anywhere whitespace-pre-wrap text-sm">{post.content}</p>

      {post.subject && (
        <div className="flex gap-2">
          <Badge variant="secondary" className="w-fit text-xs">
            {post.subject}
          </Badge>
          {post.topic && (
            <Badge variant="outline" className="text-xs">
              {post.topic}
            </Badge>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 border-border/50 border-t pt-2">
        <ReactionBar
          reactions={aggregatedReactions}
          currentUserId={user?.$id}
          onToggle={(emoji) => onToggleReaction?.(post.$id, emoji)}
        />
        <button
          type="button"
          onClick={() => setShowComments(!showComments)}
          className={cn(
            "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-colors",
            showComments
              ? "bg-(--system-accent)/10 text-(--system-accent)"
              : "text-(--system-text-secondary) hover:bg-(--system-surface-hover)",
          )}
        >
          <HugeiconsIcon icon={Message01Icon} className="size-3" />
          {commentCount > 0 && <span>{commentCount}</span>}
        </button>
      </div>

      {showComments && (
        <div className="border-border/50 border-t pt-3">
          <CommentForm
            postId={post.$id}
            onSubmit={(content, parentId) => onCreateComment?.(post.$id, content, parentId)}
          />
          {comments && comments.length > 0 && (
            <div className="mt-3">
              <CommentThread
                comments={comments}
                reactions={reactions ?? []}
                currentUserId={user?.$id ?? ""}
                postId={post.$id}
                onDelete={(id) => onDeleteComment?.(id)}
                onReply={(content, parentId) => onCreateComment?.(post.$id, content, parentId)}
                onToggleReaction={(commentId, emoji) => onToggleReaction?.(commentId, emoji)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
