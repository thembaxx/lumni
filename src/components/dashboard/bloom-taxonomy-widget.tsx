"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { competencyService } from "@/lib/competency-engine";
import type { CompetencyLevel } from "@/lib/competency-engine/types";
import type { BloomLevel } from "@/lib/question-engine/types";
import { cn } from "@/lib/utils";

const BLOOM_ORDER: BloomLevel[] = [
  "remember",
  "understand",
  "apply",
  "analyze",
  "evaluate",
  "create",
];

const BLOOM_LABELS: Record<BloomLevel, string> = {
  remember: "Recall",
  understand: "Explain",
  apply: "Apply",
  analyze: "Analyze",
  evaluate: "Evaluate",
  create: "Create",
};

const COMPETENCY_COLORS: Record<CompetencyLevel, string> = {
  novice: "bg-destructive/20 text-destructive",
  developing: "bg-warning/20 text-warning",
  proficient: "bg-success/20 text-success",
  mastered: "bg-(--system-accent)/20 text-(--system-accent)",
};

const LEVEL_RECOMMENDATIONS: Record<CompetencyLevel, { format: string; description: string }> = {
  novice: {
    format: "Flashcards + Summaries",
    description: "Focus on memorising key facts and terms",
  },
  developing: {
    format: "Practice Quizzes",
    description: "Test your understanding with guided questions",
  },
  proficient: {
    format: "Past Papers + Problems",
    description: "Apply knowledge to exam-style questions",
  },
  mastered: {
    format: "Teach + Create",
    description: "Create study sets or explain to peers",
  },
};

export function BloomTaxonomyWidget() {
  const {
    data: competencies = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["bloom-taxonomy-widget"],
    queryFn: () => competencyService.getCompetencies(""),
  });

  const topicData = useMemo(() => {
    const grouped: Record<string, CompetencyLevel[]> = {};
    const scores: Record<string, Record<string, number>> = {};

    for (const c of competencies) {
      if (!c.subjectId || !c.topicId) continue;
      const key = `${c.subjectId}::${c.topicId}`;
      if (!grouped[key]) grouped[key] = [];
      if (!scores[key]) scores[key] = {};
      grouped[key].push(c.level);
      scores[key][c.bloomLevel] = c.score;
    }

    return Object.entries(grouped).map(([key, _levels]) => {
      const [, topicId] = key.split("::");
      const levelScores = scores[key] ?? {};
      return {
        topicId,
        levels: Object.fromEntries(BLOOM_ORDER.map((bl) => [bl, levelScores[bl] ?? 0])) as Record<
          BloomLevel,
          number
        >,
      };
    });
  }, [competencies]);

  if (isError) {
    return (
      <Card className="rounded-card shadow-level-1">
        <CardHeader>
          <CardTitle className="font-bold text-sm tracking-tight">
            Bloom's Taxonomy Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-4 text-center text-destructive text-xs">
            Failed to load data: {error?.message}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (topicData.length === 0 && !isLoading) return null;

  if (isLoading) {
    return (
      <Card className="rounded-card shadow-level-1">
        <CardHeader>
          <CardTitle className="font-bold text-sm tracking-tight">
            Bloom's Taxonomy Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton loader
            <div key={i} className="rounded-xl bg-muted/40 p-3">
              <div className="mb-2 flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <div className="flex gap-1">
                {Array.from({ length: 6 }).map((_, j) => (
                  <div
                    // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton loader
                    key={j}
                    className="flex flex-1 flex-col items-center gap-1"
                  >
                    <Skeleton className="h-12 w-full rounded-md" />
                    <Skeleton className="h-3 w-6" />
                  </div>
                ))}
              </div>
              <Skeleton className="mt-2 h-3 w-48" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-card shadow-level-1">
      <CardHeader>
        <CardTitle className="font-bold text-sm tracking-tight">
          Bloom's Taxonomy Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {topicData.slice(0, 4).map((topic) => {
          const totalScores = Object.values(topic.levels);
          const avgScore =
            totalScores.length > 0
              ? totalScores.reduce((a, b) => a + b, 0) / totalScores.length
              : 0;
          const overall: CompetencyLevel =
            avgScore >= 80
              ? "mastered"
              : avgScore >= 60
                ? "proficient"
                : avgScore >= 40
                  ? "developing"
                  : "novice";
          return (
            <div key={topic.topicId} className="rounded-xl bg-muted/40 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-medium text-sm capitalize">{topic.topicId.replace(/-/g, " ")}</p>
                <span
                  className={cn(
                    "ios-caption-3 rounded-full px-2 py-0.5 font-medium",
                    COMPETENCY_COLORS[overall],
                  )}
                >
                  {overall}
                </span>
              </div>
              <div className="mb-2 flex gap-1">
                {BLOOM_ORDER.map((bl) => {
                  const score = topic.levels[bl];
                  const fill =
                    score >= 80
                      ? "bg-(--system-accent)"
                      : score >= 50
                        ? "bg-(--system-accent)/50"
                        : "bg-muted-foreground/20";
                  return (
                    <div key={bl} className="flex flex-1 flex-col items-center gap-1">
                      <div className="h-12 w-full overflow-hidden rounded-md bg-muted">
                        <div
                          className={cn("h-full w-full rounded-md transition-[height]", fill)}
                          style={{ height: `${Math.max(8, score)}%` }}
                        />
                      </div>
                      <span className="ios-caption-3 text-muted-foreground uppercase">
                        {BLOOM_LABELS[bl].slice(0, 3)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="ios-caption-3 text-muted-foreground">
                Recommended:{" "}
                <span className="font-medium text-foreground">
                  {LEVEL_RECOMMENDATIONS[overall].format}
                </span>{" "}
                - {LEVEL_RECOMMENDATIONS[overall].description}
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
