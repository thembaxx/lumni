"use client";

import BookOpen01Icon from "@hugeicons/core-free-icons/BookOpen01Icon";
import CheckmarkCircle01Icon from "@hugeicons/core-free-icons/CheckmarkCircle01Icon";
import PlayIcon from "@hugeicons/core-free-icons/PlayIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { FadeIn } from "@/components/shared/fade-in";
import { useMemo, useState } from "react";
import { AmbientGradient } from "@/components/shared/ambient-gradient";
import { PageContainer } from "@/components/layout/page-container";
import { motionEase } from "@/lib/utils/animation";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { SubjectSelect } from "@/components/ui/subject-select";
import { curriculumRegistry } from "@/curriculum";
import type { SubjectCurriculum } from "@/curriculum/types";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { dexieDataAccess } from "@/lib/db";
import { getAllStoryMetas, getLanguageLabel } from "@/lib/stories/story-data";

interface LessonProgressRow {
  userId: string;
  lessonId: string;
  completedSections: number;
  totalSections: number;
}

export function StudyBrowserClient() {
  const { user } = useAuth();
  const { push } = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");

  const { data: curriculum, isLoading: curriculumLoading } = useQuery({
    queryKey: ["curriculum", selectedSubject],
    queryFn: async () => {
      if (!selectedSubject) return null;
      const c = await curriculumRegistry.getSubject(selectedSubject);
      return c as SubjectCurriculum;
    },
    enabled: !!selectedSubject,
  });

  const { data: progressMap } = useQuery({
    queryKey: ["lesson-progress-all", user?.$id],
    queryFn: async () => {
      if (!user?.$id) return {};
      try {
        const records = await dexieDataAccess.lessonProgress
          .where("userId")
          .equals(user.$id)
          .toArray();
        const map: Record<string, LessonProgressRow> = {};
        for (const r of records) {
          map[r.lessonId] = r;
        }
        return map;
      } catch {
        return {};
      }
    },
    enabled: !!user?.$id,
  });

  const { data: storyMetaMap } = useQuery({
    queryKey: ["story-metas-for-subject", selectedSubject],
    queryFn: async () => {
      if (!selectedSubject) return null;
      const all = await getAllStoryMetas();
      const langId = selectedSubject;
      const map = new Map<string, { id: string; title: string }>();
      for (const s of all) {
        if (s.languageId === langId) {
          map.set(s.id, { id: s.id, title: s.title });
        }
      }
      return map;
    },
    enabled: !!selectedSubject,
  });

  const filteredTopics = useMemo(() => {
    if (!curriculum) return [];
    if (!selectedTopic) return curriculum.topics;
    return curriculum.topics.filter((t) => t.id === selectedTopic);
  }, [curriculum, selectedTopic]);

  const topics = curriculum?.topics ?? [];

  return (
    <div className="min-h-dvh bg-system-grouped pt-4">
      <AmbientGradient />
      <PageContainer className="flex flex-col gap-6">
        <m.div
          initial={prefersReducedMotion ? undefined : { opacity: 0, y: 12 }}
          animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
          transition={prefersReducedMotion ? undefined : { duration: 0.3, ease: motionEase }}
        >
          <div className="flex flex-col gap-1">
            <h1 className="ios-title-1 font-bold text-foreground tracking-tight">Browse Lessons</h1>
            <p className="text-muted-foreground text-sm">
              Select a subject and topic to start learning
            </p>
          </div>
        </m.div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-48 flex-1">
            <SubjectSelect
              value={selectedSubject}
              onChange={(s: string) => {
                setSelectedSubject(s);
                setSelectedTopic("");
              }}
            />
          </div>

          {topics.length > 0 && (
            <div className="min-w-44 flex-1">
              <Select
                value={selectedTopic || "__all"}
                onValueChange={(v) => setSelectedTopic(v === "__all" ? "" : (v ?? ""))}
              >
                <SelectTrigger aria-label="Filter by topic">
                  <SelectValue placeholder="All Topics" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">All Topics</SelectItem>
                  {topics.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {!selectedSubject && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <HugeiconsIcon icon={BookOpen01Icon} className="size-12 text-muted-foreground/30" />
            <p className="font-semibold text-lg">Choose a subject</p>
            <p className="text-muted-foreground text-sm">
              Pick a subject above to see available lessons
            </p>
          </div>
        )}

        {curriculumLoading && (
          <div className="flex flex-col gap-3">
            {[...Array(4)].map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton loader
              <Skeleton key={`sk-${i}`} className="h-20 w-full rounded-2xl" />
            ))}
          </div>
        )}

        {!curriculumLoading && curriculum && filteredTopics.length === 0 && (
          <div className="py-12 text-center text-muted-foreground text-sm">
            No topics found for this subject.
          </div>
        )}

        {!curriculumLoading && filteredTopics.length > 0 && (
          <div className="flex flex-col gap-6">
            {filteredTopics.map((topic) => (
              <FadeIn key={topic.id} direction="up" distance={12} duration={0.3}>
                <Card className="overflow-hidden rounded-card shadow-level-1">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="font-bold text-lg">{topic.name}</CardTitle>
                      <Badge variant="secondary" className="rounded-full text-xs">
                        {topic.subtopics.length} lessons
                      </Badge>
                    </div>
                    {topic.prerequisites.length > 0 && (
                      <p className="text-muted-foreground text-xs">
                        Prerequisites: {topic.prerequisites.join(", ")}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2 p-5 pt-0">
                    {topic.subtopics
                      .toSorted((a, b) => a.order - b.order)
                      .map((subtopic) => {
                        const lessonKey = `${selectedSubject}:${topic.id}:${subtopic.id}`;
                        const progress = progressMap?.[lessonKey];
                        const completedCount = progress?.completedSections ?? 0;
                        const totalCount = progress?.totalSections ?? 0;
                        const pct =
                          totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
                        const isComplete = pct === 100 && totalCount > 0;

                        return (
                          <button
                            key={subtopic.id}
                            type="button"
                            onClick={() =>
                              push(`/study/${selectedSubject}/${topic.id}/${subtopic.id}`)
                            }
                            className="flex items-center gap-3 rounded-xl border bg-card p-3 text-left transition-[background-color] hover:bg-muted/50 active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-primary"
                          >
                            <div
                              className={cn(
                                "flex size-9 shrink-0 items-center justify-center rounded-full",
                                isComplete ? "bg-success/10" : "bg-(--system-accent)/10",
                              )}
                            >
                              {isComplete ? (
                                <HugeiconsIcon
                                  icon={CheckmarkCircle01Icon}
                                  className="size-4 text-success"
                                />
                              ) : (
                                <HugeiconsIcon
                                  icon={PlayIcon}
                                  className="size-4 text-(--system-accent)"
                                />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-semibold text-sm">{subtopic.name}</p>
                              {totalCount > 0 && (
                                <div className="mt-1 flex items-center gap-2">
                                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                                    <div
                                      className="h-full rounded-full bg-(--system-accent) transition-[width]"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                  <span className="text-(--fs-caption-3) text-muted-foreground tabular-nums">
                                    {pct}%
                                  </span>
                                </div>
                              )}
                              {subtopic.stories && subtopic.stories.length > 0 && storyMetaMap && (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {subtopic.stories.slice(0, 3).map((sid) => {
                                    const sm = storyMetaMap.get(sid);
                                    if (!sm) return null;
                                    return (
                                      <button
                                        key={sid}
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          push(`/stories/${sid}`);
                                        }}
                                        className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card px-2.5 py-0.5 text-(--fs-caption-3) text-muted-foreground transition-colors hover:bg-(--system-accent)/10 hover:text-(--system-accent)"
                                      >
                                        <HugeiconsIcon icon={BookOpen01Icon} className="size-3" />
                                        {sm.title}
                                      </button>
                                    );
                                  })}
                                  {subtopic.stories.length > 3 && (
                                    <span className="inline-flex items-center px-1 text-(--fs-caption-3) text-muted-foreground">
                                      +{subtopic.stories.length - 3} more
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            <HugeiconsIcon
                              icon={PlayIcon}
                              className="size-4 shrink-0 text-muted-foreground"
                            />
                          </button>
                        );
                      })}
                  </CardContent>
                </Card>
              </FadeIn>
            ))}
          </div>
        )}
      </PageContainer>
    </div>
  );
}
