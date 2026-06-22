"use client";

import Message02Icon from "@hugeicons/core-free-icons/Message02Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { Skeleton } from "@/components/ui/skeleton";
import { useGroupPosts } from "@/hooks/use-study-groups";
import { PostCardWithComments } from "./post-card-with-comments";

interface Props {
  groupId: string;
}

export function DiscussionFeed({ groupId }: Props) {
  const { data: posts, isLoading } = useGroupPosts(groupId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
        <HugeiconsIcon icon={Message02Icon} className="size-8 opacity-40" />
        <p className="text-sm">No discussions yet</p>
        <p className="text-xs opacity-60">Ask a question to start a group discussion</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {posts.map((post) => (
        <PostCardWithComments key={post.$id} post={post} groupId={groupId} />
      ))}
    </div>
  );
}
