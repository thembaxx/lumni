"use client";

import { useState } from "react";
import type { GroupComment, GroupReaction } from "@/lib/study-groups/types";
import { cn } from "@/lib/utils";
import { CommentForm } from "./comment-form";
import { ReactionBar } from "./reaction-bar";

interface CommentCardProps {
  comment: GroupComment;
  reactions: GroupReaction[];
  depth: number;
  currentUserId: string;
  postId: string;
  onDelete: (commentId: string) => void;
  onReply: (content: string, parentId?: string) => void;
  onToggleReaction: (commentId: string, emoji: string) => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  return new Date(dateStr).toLocaleDateString();
}

export function CommentCard({
  comment,
  reactions,
  depth,
  currentUserId,
  postId,
  onDelete,
  onReply,
  onToggleReaction,
}: CommentCardProps) {
  const [showReply, setShowReply] = useState(false);

  const commentReactions = reactions.filter((r) => r.commentId === comment.$id);

  const aggregatedReactions = commentReactions.reduce<
    { emoji: string; userId: string; count: number }[]
  >((acc, r) => {
    const existing = acc.find((a) => a.emoji === r.emoji);
    if (existing) {
      existing.count++;
    } else {
      acc.push({ emoji: r.emoji, userId: r.userId, count: 1 });
    }
    return acc;
  }, []);

  return (
    <div
      className={cn(
        "group",
        depth === 0
          ? "bg-transparent"
          : "rounded-lg border border-(--system-border) bg-(--system-surface-secondary) p-3",
      )}
    >
      <div className="flex items-start gap-2 py-2">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-(--system-accent)/10 font-semibold text-(--system-accent) text-xs">
          {(comment.userName || "?")[0].toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-(--system-text-primary) text-xs">
              {comment.userName || "Anonymous"}
            </span>
            <span className="text-(--system-text-tertiary) text-xs">
              {timeAgo(comment.createdAt)}
            </span>
          </div>
          <p className="mt-0.5 text-(--system-text-secondary) text-sm">{comment.content}</p>
          <div className="mt-1 flex items-center gap-3">
            <ReactionBar
              reactions={aggregatedReactions}
              currentUserId={currentUserId}
              onToggle={(emoji) => onToggleReaction(comment.$id, emoji)}
            />
            <button
              type="button"
              onClick={() => setShowReply(!showReply)}
              className="text-(--system-text-tertiary) text-xs transition-colors hover:text-(--system-accent)"
            >
              Reply
            </button>
            {comment.userId === currentUserId && (
              <button
                type="button"
                onClick={() => onDelete(comment.$id)}
                className="text-(--system-text-tertiary) text-xs opacity-0 transition-opacity hover:text-(--system-destructive) group-hover:opacity-100"
              >
                Delete
              </button>
            )}
          </div>
          {showReply && (
            <div className="mt-2">
              <CommentForm
                postId={postId}
                parentId={comment.$id}
                placeholder={`Reply to ${comment.userName || "Anonymous"}...`}
                onSubmit={(content, parentId) => {
                  onReply(content, parentId);
                  setShowReply(false);
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
