"use client";

import Message02Icon from "@hugeicons/core-free-icons/Message02Icon";
import Pin02Icon from "@hugeicons/core-free-icons/Pin02Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { useGroupPosts, usePinPost, useUnpinPost } from "@/hooks/use-study-groups";
import { PostCardWithComments } from "./post-card-with-comments";

interface Props {
  groupId: string;
}

export function DiscussionFeed({ groupId }: Props) {
  const t = useTranslations();
  const { data: posts, isLoading } = useGroupPosts(groupId);
  const { mutate: pinPost } = usePinPost();
  const { mutate: unpinPost } = useUnpinPost();

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

  const pinnedPosts = posts.filter((p) => p.isPinned);
  const regularPosts = posts.filter((p) => !p.isPinned);

  return (
    <div className="flex flex-col gap-3">
      {pinnedPosts.length > 0 && (
        <>
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
            <HugeiconsIcon icon={Pin02Icon} className="size-3" />
            {t("studyGroups.pinnedPosts")}
          </div>
          {pinnedPosts.map((post) => (
            <PostCardWithComments
              key={post.$id}
              post={post}
              groupId={groupId}
              onPin={() => unpinPost({ groupId, postId: post.$id })}
            />
          ))}
          <hr className="border-border/50" />
        </>
      )}
      {regularPosts.map((post) => (
        <PostCardWithComments
          key={post.$id}
          post={post}
          groupId={groupId}
          onPin={() => pinPost({ groupId, postId: post.$id })}
        />
      ))}
    </div>
  );
}
