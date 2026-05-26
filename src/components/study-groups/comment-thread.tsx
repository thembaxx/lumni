"use client";

import type { GroupComment, GroupReaction } from "@/lib/study-groups/types";
import { CommentCard } from "./comment-card";

interface CommentThreadProps {
	comments: GroupComment[];
	reactions: GroupReaction[];
	depth?: number;
	parentId?: string;
	currentUserId: string;
	postId: string;
	onDelete: (commentId: string) => void;
	onReply: (content: string, parentId?: string) => void;
	onToggleReaction: (commentId: string, emoji: string) => void;
}

export function CommentThread({
	comments,
	reactions,
	depth = 0,
	parentId,
	currentUserId,
	postId,
	onDelete,
	onReply,
	onToggleReaction,
}: CommentThreadProps) {
	const filtered = comments.filter((c) =>
		parentId ? c.parentId === parentId : !c.parentId,
	);

	if (filtered.length === 0) return null;

	return (
		<div
			className={
				depth > 0 ? "ml-4 border-l-2 border-[--system-border] pl-3" : ""
			}
		>
			{filtered.map((comment) => (
				<div key={comment.$id}>
					<CommentCard
						comment={comment}
						reactions={reactions}
						depth={depth}
						currentUserId={currentUserId}
						postId={postId}
						onDelete={onDelete}
						onReply={onReply}
						onToggleReaction={onToggleReaction}
					/>
					<CommentThread
						comments={comments}
						reactions={reactions}
						depth={depth + 1}
						parentId={comment.$id}
						currentUserId={currentUserId}
						postId={postId}
						onDelete={onDelete}
						onReply={onReply}
						onToggleReaction={onToggleReaction}
					/>
				</div>
			))}
		</div>
	);
}
