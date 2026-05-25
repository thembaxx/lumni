"use client";

import {
	Delete02Icon,
	Message01Icon,
	UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { format } from "date-fns";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	useDeletePost,
} from "@/hooks/use-study-groups";
import { useAuth } from "@/lib/auth/auth-context";
import type { GroupComment, GroupPost, GroupReaction } from "@/lib/study-groups/types";
import { cn } from "@/lib/shared";
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
}

export function PostCard({
	post,
	groupId,
	comments,
	reactions,
	onToggleReaction,
	onCreateComment,
	onDeleteComment,
}: Props) {
	const { user } = useAuth();
	const { mutate: deletePost } = useDeletePost();
	const isOwner = user?.$id === post.userId;
	const [showComments, setShowComments] = useState(false);

	const postReactions = (reactions ?? []).filter((r) => r.postId === post.$id);
	const aggregatedReactions = postReactions.reduce<
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
				{isOwner && (
					<Button
						variant="ghost"
						size="icon-sm"
						className="size-7 text-muted-foreground hover:text-destructive"
						onClick={() => deletePost(post.$id)}
					>
						<HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
					</Button>
				)}
			</div>

			{post.questionText && (
				<div className="rounded-md bg-muted/50 px-3 py-2 text-sm italic text-muted-foreground">
					{post.questionText}
				</div>
			)}

			<p className="text-sm whitespace-pre-wrap">{post.content}</p>

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

			<div className="flex items-center gap-2 border-t border-border/50 pt-2">
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
							? "bg-[--system-accent]/10 text-[--system-accent]"
							: "text-[--system-text-secondary] hover:bg-[--system-surface-hover]",
					)}
				>
					<HugeiconsIcon icon={Message01Icon} className="size-3" />
					{commentCount > 0 && <span>{commentCount}</span>}
				</button>
			</div>

			{showComments && (
				<div className="border-t border-border/50 pt-3">
					<CommentForm
						postId={post.$id}
						onSubmit={(content, parentId) =>
							onCreateComment?.(post.$id, content, parentId)
						}
					/>
					{comments && comments.length > 0 && (
						<div className="mt-3">
							<CommentThread
								comments={comments as any}
								reactions={reactions ?? []}
								currentUserId={user?.$id ?? ""}
								postId={post.$id}
								onDelete={(id) => onDeleteComment?.(id)}
								onReply={(content, parentId) =>
									onCreateComment?.(post.$id, content, parentId)
								}
								onToggleReaction={(commentId, emoji) =>
									onToggleReaction?.(commentId, emoji)
								}
							/>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
