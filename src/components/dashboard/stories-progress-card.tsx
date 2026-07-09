"use client";

import BookOpen01Icon from "@hugeicons/core-free-icons/BookOpen01Icon";
import OpenBookIcon from "@hugeicons/core-free-icons/Book01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { FadeIn } from "@/components/shared/fade-in";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigationDirection } from "@/hooks/use-navigation-direction";
import { useAuth } from "@/lib/auth/auth-context";
import { dexieDataAccess } from "@/lib/db";

export function StoriesProgressCard() {
  const { user } = useAuth();
  const { push } = useNavigationDirection();
  const userId = user?.$id ?? "anonymous";

  const { data: recentStories, isLoading } = useQuery({
    queryKey: ["stories-progress-dashboard", userId],
    queryFn: async () => {
      const progress = await dexieDataAccess.storyProgress.where("userId").equals(userId).toArray();

      const recent = progress
        .toSorted((a, b) => (b.lastReadAt ?? 0) - (a.lastReadAt ?? 0))
        .slice(0, 3);

      if (recent.length === 0) return [];

      const storyKeys = recent.map((p) => `story:${p.storyId}`);
      const cached = await dexieDataAccess.storyCache.where("key").anyOf(storyKeys).toArray();
      const cacheMap = new Map(cached.map((c) => [c.key, c.story]));

      return recent.map((p) => ({
        storyId: p.storyId,
        title:
          (cacheMap.get(`story:${p.storyId}`) as { title?: string } | undefined)?.title ??
          p.storyId,
        scrollPercent: p.scrollPercent ?? 0,
        completed: p.completed ?? false,
        lastReadAt: p.lastReadAt,
      }));
    },
    enabled: userId !== "anonymous",
  });

  const hasStories = recentStories && recentStories.length > 0;

  if (isLoading) return null;

  return (
    <Card className="overflow-hidden rounded-card shadow-level-1">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-bold text-lg">Keep Reading</CardTitle>
          <HugeiconsIcon icon={OpenBookIcon} className="size-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 p-5 pt-0">
        {hasStories ? (
          recentStories!.map((story) => (
            <FadeIn
              key={story.storyId}
              direction="up"
              distance={8}
              className="flex items-center gap-3 rounded-2xl border bg-card p-3"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-(--system-accent)/10">
                <HugeiconsIcon icon={BookOpen01Icon} className="size-4 text-(--system-accent)" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-sm">{story.title}</p>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full origin-left rounded-full bg-(--system-accent) transition-[transform]"
                      style={{
                        transform: `scaleX(${story.completed ? 1 : Math.max(story.scrollPercent / 100, 0.05)})`,
                      }}
                    />
                  </div>
                  <span className="text-(--fs-caption-3) text-muted-foreground tabular-nums">
                    {story.completed ? "Done" : `${Math.round(story.scrollPercent)}%`}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 rounded-full text-xs"
                onClick={() => push(`/stories/${story.storyId}`)}
              >
                {story.completed ? "Read Again" : "Continue"}
              </Button>
            </FadeIn>
          ))
        ) : (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <HugeiconsIcon icon={OpenBookIcon} className="size-10 text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">
              Explore stories to build reading skills.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => push("/stories")}
            >
              Browse Stories
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
