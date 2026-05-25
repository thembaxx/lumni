"use client";

import {
	Delete02Icon,
	Message01Icon,
	UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDeletePost } from "@/hooks/use-study-groups";
import { useAuth } from "@/lib/auth/auth-context";
import type { GroupPost } from "@/lib/study-groups/types";

interface Props {
	post: GroupPost;
}

export function PostCard({ post }: Props) {
	const { user } = useAuth();
	const { mutate: deletePost } = useDeletePost();
	const isOwner = user?.$id === post.userId;

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
		</div>
	);
}
