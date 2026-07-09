"use client";

import Award01Icon from "@hugeicons/core-free-icons/Award01Icon";
import BookOpen01Icon from "@hugeicons/core-free-icons/BookOpen01Icon";
import Clock01Icon from "@hugeicons/core-free-icons/Clock01Icon";
import Mortarboard01Icon from "@hugeicons/core-free-icons/Mortarboard01Icon";
import Target01Icon from "@hugeicons/core-free-icons/Target01Icon";
import WorkoutSportIcon from "@hugeicons/core-free-icons/WorkoutSportIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { SubjectsDrawer } from "@/components/dashboard/drawers/subjects-drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useFilteredSubjects } from "@/hooks/use-subjects";
import { useRouter } from "@/i18n/navigation";
import type { TopicRecommendation } from "@/lib/competency-engine/path-engine";

const levelColors: Record<string, string> = {
  novice: "bg-destructive/10 text-destructive border-destructive/20",
  developing: "bg-warning/10 text-warning border-warning/20",
  proficient: "bg-info/10 text-info border-info/20",
  mastered: "bg-success/10 text-success border-success/20",
  unknown: "bg-muted text-muted-foreground border-border",
};

const actionIcons = {
  study: BookOpen01Icon,
  practice: WorkoutSportIcon,
  review: Clock01Icon,
  skip: Award01Icon,
};

const actionLabels: Record<string, string> = {
  study: "Study",
  practice: "Practice",
  review: "Review",
  skip: "Mastered",
};

export function LessonLibrary() {
  const { push } = useRouter();
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  useFilteredSubjects("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["next-topics", selectedSubject],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedSubject) params.set("subject", selectedSubject);
      const res = await fetch(`/api/engine/next-topics?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch recommendations");
      return res.json() as Promise<{
        recommendations: TopicRecommendation[];
        summary: {
          total: number;
          novice: number;
          developing: number;
          proficient: number;
          mastered: number;
          averageScore: number;
        };
      }>;
    },
    enabled: !!selectedSubject,
    staleTime: 1000 * 60 * 5,
  });

  const recommendations = data?.recommendations ?? [];
  const summary = data?.summary;
  const activeRecs = recommendations.filter((r) => r.action !== "skip");
  const nextUp = activeRecs[0];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-balance font-semibold text-lg">
            <HugeiconsIcon icon={Target01Icon} className="size-5 text-system-accent" />
            Your Learning Path
          </h2>
          <p className="mt-0.5 text-pretty text-muted-foreground text-sm">
            Personalized recommendations based on your progress
          </p>
        </div>
        <SubjectsDrawer onSelect={(subject) => setSelectedSubject(subject)}>
          <Button variant="outline" size="sm" className="gap-2">
            {selectedSubject ?? "Select subject"}
          </Button>
        </SubjectsDrawer>
      </div>

      {!selectedSubject && (
        <Card className="rounded-3xl text-center">
          <CardContent className="flex flex-col items-center gap-3 p-8">
            <HugeiconsIcon icon={Mortarboard01Icon} className="size-10 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">
              Select a subject to see your personalized study recommendations.
            </p>
          </CardContent>
        </Card>
      )}

      {isLoading && selectedSubject && (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      )}

      {error && selectedSubject && (
        <Card className="rounded-3xl text-center">
          <CardContent className="p-6">
            <p className="text-destructive text-sm">Failed to load recommendations.</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && selectedSubject && summary && (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {(
              [
                {
                  label: "Total",
                  value: summary.total,
                  color: "text-muted-foreground",
                },
                {
                  label: "Novice",
                  value: summary.novice,
                  color: "text-(--system-destructive)",
                },
                {
                  label: "Developing",
                  value: summary.developing,
                  color: "text-(--system-warning)",
                },
                {
                  label: "Proficient",
                  value: summary.proficient,
                  color: "text-(--system-accent)",
                },
                {
                  label: "Mastered",
                  value: summary.mastered,
                  color: "text-(--system-success)",
                },
              ] as const
            ).map((s) => (
              <Card key={s.label} className="text-center">
                <CardContent className="p-3">
                  <div className={`font-bold text-lg tabular-nums ${s.color}`}>{s.value}</div>
                  <div className="text-muted-foreground text-xs">{s.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {summary.averageScore > 0 && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <HugeiconsIcon icon={Award01Icon} className="size-4 text-(--system-warning)" />
              Average competency score:{" "}
              <span className="tabular-nums">{Math.round(summary.averageScore)}%</span>
            </div>
          )}

          {nextUp && <NextUpCard nextUp={nextUp} selectedSubject={selectedSubject} />}

          {recommendations.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="font-medium text-muted-foreground text-sm">All Topics</h3>
              {recommendations.map((rec) => {
                const Icon = actionIcons[rec.action];
                return (
                  <Card
                    key={rec.topicId}
                    className={`rounded-3xl ${rec.action === "skip" ? "opacity-50" : ""}`}
                  >
                    <CardContent className="flex items-center justify-between gap-3 p-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className={`flex size-8 items-center justify-center rounded-lg ${levelColors[rec.level] ?? "bg-muted"}`}
                        >
                          <HugeiconsIcon icon={Icon} className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-sm">{rec.name}</p>
                          <div className="flex items-center gap-2 text-muted-foreground text-xs">
                            <Badge
                              variant="outline"
                              className={`ios-caption-3 px-1.5 py-0 capitalize ${levelColors[rec.level] ?? ""}`}
                            >
                              {rec.level}
                            </Badge>
                            <span className="capitalize">{actionLabels[rec.action]}</span>
                            {rec.estimatedMinutes > 0 && <span>{rec.estimatedMinutes} min</span>}
                          </div>
                        </div>
                      </div>
                      {rec.action !== "skip" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            push(
                              `/quiz?subject=${encodeURIComponent(selectedSubject)}&topic=${encodeURIComponent(rec.topicId)}`,
                            )
                          }
                        >
                          Practice
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {!isLoading && recommendations.length === 0 && selectedSubject && (
            <Card className="rounded-3xl text-center">
              <CardContent className="flex flex-col items-center gap-2 p-6">
                <HugeiconsIcon icon={Award01Icon} className="size-8 text-(--system-success)" />
                <p className="text-muted-foreground text-sm">
                  No recommendations available. All topics may be mastered.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function NextUpCard({
  nextUp,
  selectedSubject,
}: {
  nextUp: TopicRecommendation;
  selectedSubject: string;
}) {
  const { push } = useRouter();
  const NextActionIcon = actionIcons[nextUp.action];
  return (
    <Card className="rounded-3xl border-system-accent/20 bg-system-accent/5">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Next Up
              </Badge>
              <Badge
                variant="outline"
                className={`text-xs capitalize ${levelColors[nextUp.level] ?? ""}`}
              >
                {nextUp.level}
              </Badge>
            </div>
            <h3 className="truncate font-semibold text-base">{nextUp.name}</h3>
            <div className="flex items-center gap-3 text-muted-foreground text-xs">
              <span className="flex items-center gap-1 capitalize">
                <HugeiconsIcon icon={NextActionIcon} className="size-3.5" />
                {actionLabels[nextUp.action]}
              </span>
              <span className="flex items-center gap-1">
                <HugeiconsIcon icon={Clock01Icon} className="size-3.5" />
                {nextUp.estimatedMinutes} min
              </span>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() =>
              push(
                `/quiz?subject=${encodeURIComponent(selectedSubject)}&topic=${encodeURIComponent(nextUp.topicId)}`,
              )
            }
          >
            Start
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
