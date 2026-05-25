"use client";

import { Message02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";
import { useGroupPosts } from "@/hooks/use-study-groups";
import { PostCard } from "./post-card";

interface Props {
	groupId: string;
}

export function DiscussionFeed({ groupId }: Props) {
	const t = useTranslations();
	const { data: posts, isLoading } = useGroupPosts(groupId);

	if (isLoading) {
		return (
			<div className="flex flex-col gap-3">
				{[1, 2].map((i) => (
					<div
						key={i}
						className="h-24 animate-pulse rounded-lg bg-muted"
					/>
				))}
			</div>
		);
	}

	if (!posts || posts.length === 0) {
		return (
			<div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
				<HugeiconsIcon icon={Message02Icon} className="size-8 opacity-40" />
				<p className="text-sm">No discussions yet</p>
				<p className="text-xs opacity-60">
					Ask a question to start a group discussion
				</p>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-3">
			{posts.map((post) => (
				<PostCard key={post.$id} post={post} />
			))}
		</div>
	);
}
