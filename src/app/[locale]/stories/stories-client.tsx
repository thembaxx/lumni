"use client";

import BookOpen01Icon from "@hugeicons/core-free-icons/BookOpen01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { FadeIn } from "@/components/shared/fade-in";
import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import type { StoryProgressRecord } from "@/lib/db/schema";
import { offlineDB } from "@/lib/db/schema";
import { logError } from "@/lib/shared/logger";
import { cacheAllStories } from "@/lib/stories/service";
import type { StoryMeta } from "@/lib/stories/story-data";
import { getAllStoryMetas, getLanguageLabel } from "@/lib/stories/story-data";

export function StoriesClient() {
  const { push } = useRouter();
  const { user } = useAuth();
  const [selectedLang, setSelectedLang] = useState("all");
  const [stories, setStories] = useState<StoryMeta[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [progressMap, setProgressMap] = useState<Map<string, StoryProgressRecord>>(new Map());

  const userId = user?.$id;

  useEffect(() => {
    getAllStoryMetas().then((all) => {
      setStories(all);
      const langs = [...new Set(all.map((s) => s.languageId))];
      setLanguages(langs);
    });
    cacheAllStories().catch((err) => logError("stories-client.cacheAll", err));
  }, []);

  useEffect(() => {
    if (!userId || stories.length === 0) return;
    const storyIds = new Set(stories.map((s) => s.id));
    offlineDB.storyProgress
      .where("userId")
      .equals(userId)
      .toArray()
      .then((records) => {
        const map = new Map<string, StoryProgressRecord>();
        for (const r of records) {
          if (storyIds.has(r.storyId)) {
            map.set(r.storyId, r);
          }
        }
        setProgressMap(map);
      })
      .catch((err) => logError("stories-client.loadProgress", err));
  }, [userId, stories]);

  const filtered =
    selectedLang === "all" ? stories : stories.filter((s) => s.languageId === selectedLang);

  return (
    <PageContainer className="gap-6 pt-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-extrabold text-2xl tracking-tight">Stories</h1>
        <p className="text-muted-foreground text-sm">
          Read short stories and practice reading comprehension
        </p>
      </div>

      {languages.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={selectedLang === "all" ? "default" : "outline"}
            className="cursor-pointer rounded-full px-3 text-xs"
            onClick={() => setSelectedLang("all")}
          >
            All
          </Badge>
          {languages.map((lang) => (
            <Badge
              key={lang}
              variant={selectedLang === lang ? "default" : "outline"}
              className="cursor-pointer rounded-full px-3 text-xs"
              onClick={() => setSelectedLang(lang)}
            >
              {getLanguageLabel(lang)}
            </Badge>
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <HugeiconsIcon icon={BookOpen01Icon} className="size-12 text-muted-foreground/30" />
          <p className="font-semibold text-lg">No stories yet</p>
          <p className="text-muted-foreground text-sm">Stories are being added. Check back soon!</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((story, i) => {
          const progress = progressMap.get(story.id);
          const isCompleted = progress?.completed ?? false;
          const scrollPct = progress?.scrollPercent ?? 0;
          const isPartial = !isCompleted && scrollPct > 0;

          return (
            <FadeIn key={story.id} direction="up" distance={16} duration={0.4} delay={i * 0.05}>
              <Card
                className="cursor-pointer overflow-hidden rounded-3xl shadow-level-1 transition-[background-color] duration-300 hover:bg-muted/50 active:scale-[0.98]"
                onClick={() => push(`/stories/${story.id}`)}
                role="button"
                tabIndex={0}
                aria-label={`Read ${story.title}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="font-extrabold text-lg leading-snug">
                      {story.title}
                    </CardTitle>
                    {isCompleted && (
                      <Badge
                        variant="default"
                        className="shrink-0 rounded-full bg-emerald-500/15 text-(--fs-caption-3) text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                      >
                        ✓ Completed
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 p-5 pt-0">
                  <p className="text-muted-foreground text-sm">{story.author}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="rounded-full text-xs">
                      {story.language}
                    </Badge>
                    <span className="text-muted-foreground text-xs">
                      {story.wordCount.toLocaleString()} words
                    </span>
                    <span className="text-muted-foreground text-xs">Grade {story.gradeLevel}</span>
                  </div>
                  {isPartial && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="self-start rounded-full text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        push(`/stories/${story.id}`);
                      }}
                    >
                      Continue ({scrollPct}%)
                    </Button>
                  )}
                </CardContent>
              </Card>
            </FadeIn>
          );
        })}
      </div>
    </PageContainer>
  );
}
