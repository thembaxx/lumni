"use client";

import { useQuery } from "@tanstack/react-query";
import { dexieDataAccess } from "@/lib/db";

export interface RecentStory {
  storyId: string;
  title: string;
  scrollPercent: number;
  completed: boolean;
  lastReadAt: number;
}

export function useStoryProgress(userId: string) {
  return useQuery({
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

      return recent.map(
        (p): RecentStory => ({
          storyId: p.storyId,
          title:
            (cacheMap.get(`story:${p.storyId}`) as { title?: string } | undefined)?.title ??
            p.storyId,
          scrollPercent: p.scrollPercent ?? 0,
          completed: p.completed ?? false,
          lastReadAt: p.lastReadAt,
        }),
      );
    },
    enabled: userId !== "anonymous",
  });
}
