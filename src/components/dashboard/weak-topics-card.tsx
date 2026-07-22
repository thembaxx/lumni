"use client";

import CheckmarkCircle01Icon from "@hugeicons/core-free-icons/CheckmarkCircle01Icon";
import Target01Icon from "@hugeicons/core-free-icons/Target01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "@/i18n/navigation";
import { useSubjects } from "@/hooks/use-subjects";
import { competencyService } from "@/lib/competency-engine/competency-service";

interface WeakTopic {
  topicId: string;
  subjectId: string;
  score: number;
}

export function WeakTopicsCard() {
  const { push } = useRouter();

  const { data: subjectsResponse } = useSubjects();
  const subjectsData = subjectsResponse?.subjects;

  const {
    data: weakTopics,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["weak-topics"],
    queryFn: async () => {
      const topics: WeakTopic[] = [];
      for (const s of subjectsData ?? []) {
        const records = await competencyService.getCompetencies(s.id);
        const topicMap = new Map<string, number[]>();
        for (const r of records) {
          const scores = topicMap.get(r.topicId) ?? [];
          scores.push(r.score);
          topicMap.set(r.topicId, scores);
        }
        for (const [topicId, scores] of topicMap) {
          const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
          if (avg < 50) {
            topics.push({ topicId, subjectId: s.id, score: Math.round(avg) });
          }
        }
      }
      return topics.toSorted((a, b) => a.score - b.score).slice(0, 3);
    },
    enabled: !!subjectsData && subjectsData.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return (
      <Card className="overflow-hidden rounded-card shadow-level-1">
        <CardHeader>
          <CardTitle className="font-bold text-lg text-balance">Practice Weak Topics</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 p-5 pt-0">
          <Skeleton className="h-16 w-full rounded-card" />
          <Skeleton className="h-16 w-full rounded-card" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="overflow-hidden rounded-card shadow-level-1">
        <CardHeader>
          <CardTitle className="font-bold text-lg text-balance">Practice Weak Topics</CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <p className="text-muted-foreground text-sm">Could not load weak topics.</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!weakTopics || weakTopics.length === 0) {
    return (
      <Card className="overflow-hidden rounded-card shadow-level-1">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-bold text-lg text-balance">Practice Weak Topics</CardTitle>
            <HugeiconsIcon
              icon={Target01Icon}
              className="size-5 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3 px-5 pb-6 pt-0 text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-success/10">
            <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-5 text-success" />
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="font-semibold text-sm text-foreground/80">All topics looking strong</p>
            <p className="text-muted-foreground text-xs text-pretty">
              No weak topics right now. Keep up the great work!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="card-entrance">
      <Card className="overflow-hidden rounded-card shadow-level-1">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-bold text-lg text-balance">Practice Weak Topics</CardTitle>
            <HugeiconsIcon
              icon={Target01Icon}
              className="size-5 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 p-5 pt-0">
          {weakTopics.map((topic) => (
            <div
              key={`${topic.subjectId}-${topic.topicId}`}
              className="flex items-center justify-between rounded-card border bg-card p-3"
            >
              <div className="flex min-w-0 flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="rounded-full px-1.5 py-0 text-(--fs-caption-3)"
                  >
                    {topic.subjectId}
                  </Badge>
                  <span className="text-(--fs-caption-3) text-muted-foreground">
                    <span className="tabular-nums">{topic.score}%</span> mastered
                  </span>
                </div>
                <span className="truncate text-sm">{topic.topicId}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 text-xs press-scale"
                aria-label={`Practice ${topic.topicId}`}
                onClick={() =>
                  push(
                    `/quiz?subject=${encodeURIComponent(topic.subjectId)}&topic=${encodeURIComponent(topic.topicId)}&count=5`,
                  )
                }
              >
                Practice
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
