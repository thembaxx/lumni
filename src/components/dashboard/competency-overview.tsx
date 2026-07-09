"use client";

import ChartUpIcon from "@hugeicons/core-free-icons/ChartUpIcon";
import Mortarboard01Icon from "@hugeicons/core-free-icons/Mortarboard01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadialChart } from "@/components/ui/charts/radial-chart";
import { Skeleton } from "@/components/ui/skeleton";
import { useSubjects } from "@/hooks/use-subjects";
import { competencyService } from "@/lib/competency-engine/competency-service";
import type { CompetencyRecord } from "@/lib/competency-engine/types";
import { cn } from "@/lib/utils";
import { springPresets } from "@/lib/utils/spring-presets";

interface TopicInfo {
  topicId: string;
  score: number;
  level: string;
}

interface SubjectCompetency {
  subjectId: string;
  subjectName: string;
  color: string;
  icon: string;
  total: number;
  novice: number;
  developing: number;
  proficient: number;
  mastered: number;
  averageScore: number;
  topics: TopicInfo[];
}

function CompetencyRing({ score }: { score: number }) {
  const color =
    score >= 80 ? "var(--success)" : score >= 60 ? "var(--warning)" : "var(--destructive)";

  return (
    <RadialChart value={score} size={80} color={color}>
      <span className="font-bold text-sm tabular-nums">{score}%</span>
    </RadialChart>
  );
}

export function CompetencyOverview() {
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

  const { data: subjectsResponse } = useSubjects();
  const subjectsData = subjectsResponse?.subjects;

  const {
    data: competencies,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["competency-overview"],
    queryFn: async () => {
      const allComps = await Promise.all(
        (subjectsData ?? []).map(async (s: { id: string }) => {
          const [summary, records] = await Promise.all([
            competencyService.getMasterySummary(s.id),
            competencyService.getCompetencies(s.id),
          ]);
          const topicMap = new Map<string, CompetencyRecord[]>();
          for (const r of records) {
            const existing = topicMap.get(r.topicId) ?? [];
            existing.push(r);
            topicMap.set(r.topicId, existing);
          }
          const topics: TopicInfo[] = [];
          for (const [topicId, recs] of topicMap) {
            const avgScore = recs.reduce((sum, r) => sum + r.score, 0) / recs.length;
            topics.push({
              topicId,
              score: Math.round(avgScore),
              level: recs[0].level,
            });
          }
          topics.sort((a, b) => a.score - b.score);
          return { subjectId: s.id, ...summary, topics };
        }),
      );
      return allComps.filter((c) => c.total > 0);
    },
    enabled: !!subjectsData && subjectsData.length > 0,
  });

  const subjectCompetencies: SubjectCompetency[] = useMemo(() => {
    if (!competencies || !subjectsData) return [];
    return competencies.map((comp) => {
      const subject = (
        subjectsData as {
          id: string;
          name: string;
          color: string;
          icon: string;
        }[]
      ).find((s) => s.id === comp.subjectId);
      return {
        subjectId: comp.subjectId,
        subjectName: subject?.name ?? comp.subjectId,
        color: subject?.color ?? "var(--system-text-tertiary)",
        icon: subject?.icon ?? "book",
        total: comp.total,
        novice: comp.novice,
        developing: comp.developing,
        proficient: comp.proficient,
        mastered: comp.mastered,
        averageScore: comp.averageScore,
        topics: comp.topics ?? [],
      };
    });
  }, [competencies, subjectsData]);

  if (isError) {
    return (
      <Card>
        <CardContent>
          <p className="py-6 text-center text-destructive text-sm">
            Failed to load competencies: {error?.message}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (subjectCompetencies.length === 0) {
    return null;
  }

  return (
    <div className="card-entrance">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 font-bold text-base tracking-tight">
            <HugeiconsIcon icon={Mortarboard01Icon} className="size-5" />
            Subject Mastery
          </CardTitle>
          <div className="flex items-center gap-1 text-muted-foreground text-xs">
            <HugeiconsIcon icon={ChartUpIcon} className="size-3" />
            <span>Progress</span>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {subjectCompetencies.map((sc) => (
            <div key={sc.subjectId} className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() =>
                  setExpandedSubject(expandedSubject === sc.subjectId ? null : sc.subjectId)
                }
                className="w-full text-left"
              >
                <div className="flex items-center gap-4 rounded-xl bg-muted/30 p-3 transition-colors hover:bg-muted/50">
                  <CompetencyRing score={sc.averageScore} />

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-sm">{sc.subjectName}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {sc.mastered > 0 && (
                          <span className="font-medium text-success text-xs">
                            {sc.mastered} mastered
                          </span>
                        )}
                        {sc.novice > 0 && (
                          <span className="font-medium text-destructive text-xs">
                            {sc.novice} weak
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-1.5 flex gap-1">
                      {(["novice", "developing", "proficient", "mastered"] as const).map(
                        (level) => {
                          const count = sc[level];
                          if (count === 0) return null;
                          const pct = sc.total > 0 ? (count / sc.total) * 100 : 0;
                          return (
                            <div
                              key={level}
                              className="h-1.5 w-full overflow-hidden rounded-full bg-border/20"
                            >
                              <motion.div
                                className={cn(
                                  "h-full origin-left rounded-full",
                                  level === "novice" && "bg-destructive",
                                  level === "developing" && "bg-warning",
                                  level === "proficient" && "bg-(--system-accent)",
                                  level === "mastered" && "bg-success",
                                )}
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: Math.max(pct, 4) / 100 }}
                                transition={springPresets.standard}
                              />
                            </div>
                          );
                        },
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="font-bold text-xs tabular-nums">{sc.total} topics</p>
                    <p className="ios-caption-3 text-muted-foreground">assessed</p>
                  </div>
                </div>
              </button>

              {sc.topics.length > 0 && (
                <div
                  className="ml-4 grid transition-[grid-template-rows,opacity] duration-300 ease-(--ease-ios)"
                  style={{
                    gridTemplateRows: expandedSubject === sc.subjectId ? "1fr" : "0fr",
                    opacity: expandedSubject === sc.subjectId ? 1 : 0,
                  }}
                >
                  <div className="overflow-hidden">
                    <div className="flex flex-col gap-0.5 rounded-lg border border-system-separator bg-system-surface-secondary/50 p-3">
                      {sc.topics.map((t) => (
                        <div
                          key={t.topicId}
                          className="flex items-center justify-between py-1 text-xs"
                        >
                          <span className="truncate capitalize">
                            {t.topicId.replace(/-/g, " ")}
                          </span>
                          <span
                            className={cn(
                              "ml-2 shrink-0 font-medium tabular-nums",
                              t.level === "novice" && "text-destructive",
                              t.level === "developing" && "text-warning",
                              t.level === "proficient" && "text-(--system-accent)",
                              t.level === "mastered" && "text-success",
                            )}
                          >
                            {t.score}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
