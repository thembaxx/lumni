"use client";

import BookOpen01Icon from "@hugeicons/core-free-icons/BookOpen01Icon";
import CheckmarkCircle01Icon from "@hugeicons/core-free-icons/CheckmarkCircle01Icon";
import PlayIcon from "@hugeicons/core-free-icons/PlayIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import * as m from "motion/react-m";
import { useMemo, useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { Badge } from "@/components/ui/badge";
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

interface LessonProgressRow {
  userId: string;
  lessonId: string;
  completedSections: number;
  totalSections: number;
}

export function StudyBrowserClient() {
  const { user } = useAuth();
  const { push } = useRouter();
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

  const filteredTopics = useMemo(() => {
    if (!curriculum) return [];
    if (!selectedTopic) return curriculum.topics;
    return curriculum.topics.filter((t) => t.id === selectedTopic);
  }, [curriculum, selectedTopic]);

  const topics = curriculum?.topics ?? [];

  return (
    <PageContainer className="gap-6 pt-8">
      <div className="flex flex-col gap-1">
        <h1 className="font-extrabold text-2xl tracking-tight">Browse Lessons</h1>
        <p className="text-muted-foreground text-sm">
          Select a subject and topic to start learning
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1">
          <SubjectSelect
            value={selectedSubject}
            onChange={(s: string) => {
              setSelectedSubject(s);
              setSelectedTopic("");
            }}
          />
        </div>

        {topics.length > 0 && (
          <div className="min-w-[180px] flex-1">
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
            <m.div
              key={topic.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="overflow-hidden rounded-card shadow-level-1">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-extrabold text-lg">{topic.name}</CardTitle>
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
                          className="flex items-center gap-3 rounded-xl border bg-card p-3 text-left transition-[background-color] hover:bg-muted/50 active:scale-[0.98]"
                        >
                          <div
                            className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
                              isComplete ? "bg-success/10" : "bg-[--system-accent]/10"
                            }`}
                          >
                            {isComplete ? (
                              <HugeiconsIcon
                                icon={CheckmarkCircle01Icon}
                                className="size-4 text-success"
                              />
                            ) : (
                              <HugeiconsIcon
                                icon={PlayIcon}
                                className="size-4 text-[--system-accent]"
                              />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold text-sm">{subtopic.name}</p>
                            {totalCount > 0 && (
                              <div className="mt-1 flex items-center gap-2">
                                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                                  <div
                                    className="h-full rounded-full bg-[--system-accent] transition-[width]"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="text-(--fs-caption-3) text-muted-foreground tabular-nums">
                                  {pct}%
                                </span>
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
            </m.div>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
