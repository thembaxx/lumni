"use client";

import ArrowLeft01Icon from "@hugeicons/core-free-icons/ArrowLeft01Icon";
import BookOpen01Icon from "@hugeicons/core-free-icons/BookOpen01Icon";
import CheckmarkCircle01Icon from "@hugeicons/core-free-icons/CheckmarkCircle01Icon";
import Lightning from "@hugeicons/core-free-icons/FlashIcon";
import Mic01Icon from "@hugeicons/core-free-icons/Mic01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { FadeIn } from "@/components/shared/fade-in";
import { useCallback, useEffect, useMemo } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SaveVocabularyButton } from "@/components/vocabulary/save-vocabulary-button";
import { WordLookupPopover } from "@/components/vocabulary/word-lookup-popover";
import { useLessonProgress } from "@/hooks/use-lesson-progress";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { trackLessonCompletion } from "@/lib/competency-engine";
import { suggestQuestionsForLesson } from "@/lib/integration/service";
import { getAllStoryMetas } from "@/lib/stories/story-data";

interface LessonViewProps {
  subjectId: string;
  topicId: string;
  subtopicId: string;
}

function buildLessonKey(params: LessonViewProps) {
  return `lesson:${params.subjectId}:${params.topicId}:${params.subtopicId}`;
}

export function LessonViewClient({ subjectId, topicId, subtopicId }: LessonViewProps) {
  const { push, back } = useRouter();
  const { user } = useAuth();
  const { completedSections, progress, isComplete, toggleSection } = useLessonProgress(
    user?.$id ?? "anonymous",
    `${subjectId}:${topicId}:${subtopicId}`,
  );

  const fetchCurriculum = useCallback(async () => {
    const mod = await import("@/curriculum");
    return mod.curriculumRegistry.getSubject(subjectId);
  }, [subjectId]);

  const { data: curriculum } = useQuery({
    queryKey: ["curriculum", subjectId],
    queryFn: fetchCurriculum,
    enabled: !!subjectId,
  });

  const topic = useMemo(
    () => curriculum?.topics.find((t: { id: string }) => t.id === topicId),
    [curriculum, topicId],
  );
  const subtopic = useMemo(
    () => topic?.subtopics.find((s: { id: string }) => s.id === subtopicId),
    [topic, subtopicId],
  );

  const topicIndex = useMemo(
    () => (topic ? (curriculum?.topics.indexOf(topic) ?? -1) : -1),
    [curriculum, topic],
  );
  const subtopicIndex = useMemo(
    () => (subtopic && topic ? topic.subtopics.indexOf(subtopic) : -1),
    [subtopic, topic],
  );

  const prev = useMemo(() => {
    if (!topic || subtopicIndex <= 0) return null;
    const prevSub = topic.subtopics[subtopicIndex - 1];
    return `/study/${subjectId}/${topic.id}/${prevSub.id}`;
  }, [topic, subtopicIndex, subjectId]);

  const next = useMemo(() => {
    if (!topic || subtopicIndex < 0) return null;
    if (subtopicIndex < topic.subtopics.length - 1) {
      const nextSub = topic.subtopics[subtopicIndex + 1];
      return `/study/${subjectId}/${topic.id}/${nextSub.id}`;
    }
    if (topicIndex >= 0 && curriculum && topicIndex < curriculum.topics.length - 1) {
      const nextTopic = curriculum.topics[topicIndex + 1];
      return `/study/${subjectId}/${nextTopic.id}/${nextTopic.subtopics[0].id}`;
    }
    return null;
  }, [topic, subtopicIndex, topicIndex, curriculum, subjectId]);

  const { data: lesson, isPending } = useQuery({
    queryKey: [buildLessonKey({ subjectId, topicId, subtopicId })],
    queryFn: async () => {
      const res = await fetch(
        `/api/lessons?subject=${encodeURIComponent(subjectId)}&topic=${encodeURIComponent(topicId)}&subtopic=${encodeURIComponent(subtopicId)}`,
      );
      if (!res.ok) throw new Error("Failed to fetch lesson");
      const json = await res.json();
      return json.lesson as {
        sections: {
          id: string;
          title: string;
          content: string;
          type: string;
          keyPoints?: string[];
        }[];
        summary: string;
        estimatedMinutes: number;
        vocabulary?: { term: string; definition: string }[];
      };
    },
    enabled: !!subjectId && !!topicId && !!subtopicId,
  });

  const { data: relatedQuestions } = useQuery({
    queryKey: ["related-questions", subjectId, subtopicId],
    queryFn: () => suggestQuestionsForLesson(subjectId, subtopicId),
    enabled: !!subjectId && !!subtopicId,
  });

  const { data: linkedStories } = useQuery({
    queryKey: ["linked-stories", subjectId, subtopic?.stories],
    queryFn: async () => {
      if (!subtopic?.stories || subtopic.stories.length === 0) return [];
      const all = await getAllStoryMetas();
      const langId = subjectId;
      const metaMap = new Map<string, { id: string; title: string }>();
      for (const s of all) {
        if (s.languageId === langId) metaMap.set(s.id, { id: s.id, title: s.title });
      }
      return subtopic.stories.map((sid: string) => metaMap.get(sid)).filter(Boolean) as {
        id: string;
        title: string;
      }[];
    },
    enabled: !!subtopic?.stories && subtopic.stories.length > 0,
  });

  // react-doctor/no-event-handler — analytics tracking on completion state change
  useEffect(() => {
    if (isComplete && lesson) {
      const score =
        lesson.sections.length > 0
          ? Math.round((completedSections.size / lesson.sections.length) * 100)
          : 0;
      trackLessonCompletion(user?.$id ?? "anonymous", subjectId, topicId, subtopicId, score).catch(
        () => {},
      );
    }
  }, [isComplete, lesson, completedSections.size, user?.$id, subjectId, topicId, subtopicId]);

  if (isPending) {
    return (
      <PageContainer className="gap-4 pt-8">
        <Skeleton className="h-8 w-64 rounded-2xl" />
        <Skeleton className="h-4 w-40 rounded-2xl" />
        {[...Array(3)].map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton loader
          <Skeleton key={i} className="h-32 rounded-3xl" />
        ))}
      </PageContainer>
    );
  }

  if (!lesson) {
    return (
      <PageContainer className="flex flex-col items-center gap-3 py-16 text-center">
        <HugeiconsIcon icon={BookOpen01Icon} className="size-12 text-muted-foreground/30" />
        <p className="font-semibold text-lg">Lesson not found</p>
        <p className="text-muted-foreground text-sm">
          This lesson could not be loaded. It may have been removed or the link might be incorrect.
        </p>
        <Button variant="outline" onClick={() => back()} className="mt-2 rounded-full">
          Go back
        </Button>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="gap-5 pt-8">
      <Button variant="ghost" size="sm" onClick={() => back()} className="self-start rounded-full">
        <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
        Back
      </Button>

      <FadeIn direction="up" distance={16} duration={0.4}>
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="rounded-full text-xs">
              {curriculum?.subjectName ?? subjectId}
            </Badge>
            <span className="text-muted-foreground text-xs">{topic?.name}</span>
            <span className="text-muted-foreground text-xs">
              &middot; {lesson.estimatedMinutes} min
            </span>
          </div>
          <h1 className="font-bold text-2xl tracking-tight">{subtopic?.name ?? subtopicId}</h1>
        </div>

        {progress > 0 && (
          <div className="mt-4 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-system-accent transition-[width] duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-muted-foreground text-xs tabular-nums">
              {completedSections.size}/{lesson.sections.length}
            </span>
          </div>
        )}
      </FadeIn>

      {lesson.sections.map((section, i) => {
        const isComplete = completedSections.has(section.id);
        return (
          <FadeIn key={section.id} direction="up" distance={16} duration={0.4} delay={i * 0.05}>
            <Card
              className={cn(
                "overflow-hidden rounded-3xl shadow-level-1 transition-[background-color] duration-300",
                isComplete ? "border-success/20 bg-success/5" : "",
              )}
            >
              <CardHeader className="flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="rounded-full text-(--fs-caption-3) uppercase tracking-wide"
                  >
                    {section.type}
                  </Badge>
                  <CardTitle className="font-bold text-base">{section.title}</CardTitle>
                </div>
                <button
                  type="button"
                  onClick={() => toggleSection(section.id, lesson.sections.length)}
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full border transition-colors",
                    isComplete
                      ? "border-success bg-success text-success-foreground"
                      : "border-muted-foreground/30 hover:border-muted-foreground/50",
                  )}
                  aria-label={isComplete ? "Mark incomplete" : "Mark complete"}
                >
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-4" />
                </button>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 p-5 pt-0">
                <div className="text-sm leading-relaxed">
                  <MarkdownRenderer content={section.content} />
                </div>
                {section.keyPoints && section.keyPoints.length > 0 && (
                  <div className="flex flex-col gap-1.5 rounded-xl bg-muted/50 p-3">
                    <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                      Key points
                    </span>
                    {section.keyPoints.map((kp) => (
                      <li key={kp} className="text-muted-foreground text-sm">
                        {kp}
                      </li>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </FadeIn>
        );
      })}

      {lesson.vocabulary && lesson.vocabulary.length > 0 && (
        <FadeIn direction="up" distance={16} duration={0.4}>
          <Card className="overflow-hidden rounded-3xl shadow-level-1">
            <CardHeader>
              <CardTitle className="font-bold text-lg">Vocabulary</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 p-5 pt-0">
              {lesson.vocabulary.map((v) => (
                <div
                  key={v.term}
                  className="flex items-center justify-between rounded-2xl border bg-card px-4 py-3"
                >
                  <div className="flex flex-col">
                    <WordLookupPopover word={v.term} language="en">
                      <span className="font-semibold text-sm">{v.term}</span>
                    </WordLookupPopover>
                    <span className="text-muted-foreground text-xs">{v.definition}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full"
                      aria-label={`Practice pronouncing ${v.term}`}
                      onClick={() =>
                        push(
                          `/pronunciation?text=${encodeURIComponent(v.term)}&lang=${encodeURIComponent(subjectId)}`,
                        )
                      }
                    >
                      <HugeiconsIcon icon={Mic01Icon} className="size-4" />
                    </Button>
                    <SaveVocabularyButton
                      word={v.term}
                      definition={v.definition}
                      language={subjectId}
                      sourceType="lesson"
                      sourceId={`${subjectId}:${topicId}:${subtopicId}`}
                      userId={user?.$id ?? "anonymous"}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {lesson.summary && (
        <FadeIn direction="up" distance={16} duration={0.4}>
          <Card className="overflow-hidden rounded-3xl border-info/20 bg-info/5 shadow-level-1">
            <CardHeader>
              <CardTitle className="font-bold text-lg">Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <p className="text-sm leading-relaxed">{lesson.summary}</p>
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {linkedStories && linkedStories.length > 0 && (
        <FadeIn direction="up" distance={16} duration={0.4}>
          <Card className="overflow-hidden rounded-3xl shadow-level-1">
            <CardHeader>
              <CardTitle className="font-bold text-lg">Related Reading</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 p-5 pt-0">
              {linkedStories.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => push(`/stories/${s.id}`)}
                  className="flex items-center gap-3 rounded-2xl border bg-card p-3 text-left transition-[background-color] hover:bg-muted/50 active:scale-[0.96]"
                >
                  <HugeiconsIcon
                    icon={BookOpen01Icon}
                    className="size-4 shrink-0 text-(--system-accent)"
                  />
                  <span className="text-sm font-medium">{s.title}</span>
                </button>
              ))}
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {relatedQuestions && relatedQuestions.length > 0 && (
        <FadeIn direction="up" distance={16} duration={0.4}>
          <Card className="overflow-hidden rounded-3xl shadow-level-1">
            <CardHeader>
              <CardTitle className="font-bold text-lg">Related Past Questions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 p-5 pt-0">
              {relatedQuestions.map((q) => (
                <div key={q.id} className="rounded-2xl border bg-card p-3">
                  <div className="line-clamp-2 text-sm">
                    <MarkdownRenderer content={q.questionText} />
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-muted-foreground text-xs">
                    <span>{q.year}</span>
                    {q.marks > 0 && <span>{q.marks} marks</span>}
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  push(
                    `/quiz?subject=${encodeURIComponent(subjectId)}&topic=${encodeURIComponent(topicId)}&count=5`,
                  )
                }
                className="self-start rounded-full text-xs"
              >
                Practice more
              </Button>
            </CardContent>
          </Card>
        </FadeIn>
      )}

      <div className="flex items-center justify-between gap-3 pb-8">
        {prev ? (
          <Button variant="outline" size="sm" onClick={() => push(prev)} className="rounded-full">
            ← Previous
          </Button>
        ) : (
          <div />
        )}
        {next ? (
          <Button variant="default" size="sm" onClick={() => push(next)} className="rounded-full">
            Next →
          </Button>
        ) : (
          <Button
            variant="default"
            size="sm"
            onClick={() => push(`/quiz?subject=${encodeURIComponent(subjectId)}&count=5`)}
            className="rounded-full"
          >
            <HugeiconsIcon icon={Lightning} className="size-4" />
            Practice
          </Button>
        )}
      </div>
    </PageContainer>
  );
}
