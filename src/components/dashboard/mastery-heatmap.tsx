"use client";

import ChartBarBigIcon from "@hugeicons/core-free-icons/ChartBarBigIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const BLOOM_ORDER = ["remember", "understand", "apply", "analyze", "evaluate", "create"] as const;

const LEVEL_COLORS: Record<string, string> = {
  novice: "bg-destructive/15 text-destructive",
  developing: "bg-warning/15 text-warning",
  proficient: "bg-success/15 text-success",
  mastered: "bg-info/15 text-info",
};

const LEVEL_BG: Record<string, string> = {
  novice: "bg-destructive/8",
  developing: "bg-warning/8",
  proficient: "bg-success/8",
  mastered: "bg-info/8",
};

interface CompetencyRecord {
  id?: number;
  subjectId: string;
  topicId: string;
  bloomLevel: string;
  score: number;
  attempts: number;
  lastAssessed: number;
  level: string;
}

export function MasteryHeatmap() {
  const [selectedSubject, setSelectedSubject] = useState("");

  const { data: subjects = [], isError: subjectsErr } = useQuery({
    queryKey: ["admin-subjects", "heatmap"],
    queryFn: async () => {
      const res = await fetch("/api/admin/subjects");
      if (!res.ok) return [];
      const data = await res.json();
      return (data.subjects || []) as {
        id: string;
        name: string;
        code: string;
      }[];
    },
  });

  const fetchCompetencies = useCallback(async () => {
    if (!selectedSubject) return [];
    const { competencyService } = await import("@/lib/competency-engine");
    const records = await competencyService.getCompetencies(selectedSubject);
    return records as CompetencyRecord[];
  }, [selectedSubject]);

  const {
    data: competencies = [],
    isError: compsErr,
    error,
  } = useQuery<CompetencyRecord[]>({
    queryKey: ["competencies", selectedSubject],
    queryFn: fetchCompetencies,
    enabled: !!selectedSubject,
  });

  const topics = [...new Set(competencies.map((c) => c.topicId))].toSorted();

  const compMap = useMemo(() => {
    const map = new Map<string, CompetencyRecord>();
    for (const c of competencies) {
      map.set(`${c.topicId}:${c.bloomLevel}`, c);
    }
    return map;
  }, [competencies]);

  const overallByTopic = useMemo(() => {
    const map = new Map<string, { topic: string; avgScore: number; avgLevel: string }>();
    for (const topic of topics) {
      const topicComps = competencies.filter((c) => c.topicId === topic);
      const avgScore =
        topicComps.length > 0
          ? Math.round(topicComps.reduce((s, c) => s + c.score, 0) / topicComps.length)
          : 0;
      const avgLevel =
        avgScore >= 85
          ? "mastered"
          : avgScore >= 65
            ? "proficient"
            : avgScore >= 40
              ? "developing"
              : "novice";
      map.set(topic, { topic, avgScore, avgLevel });
    }
    return map;
  }, [competencies, topics]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Select value={selectedSubject} onValueChange={(v) => setSelectedSubject(v ?? "")}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a subject" />
          </SelectTrigger>
          <SelectContent>
            {(Array.isArray(subjects) ? subjects : []).map((s) => (
              <SelectItem key={s.id || s.code} value={s.code || s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {subjectsErr && (
        <div className="flex flex-col items-center gap-3 py-12 text-destructive">
          <p className="text-sm">Failed to load subjects</p>
        </div>
      )}

      {compsErr && (
        <div className="flex flex-col items-center gap-3 py-12 text-destructive">
          <p className="text-sm">Failed to load competencies: {error?.message}</p>
        </div>
      )}

      {!selectedSubject && (
        <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
          <HugeiconsIcon icon={ChartBarBigIcon} className="size-10 text-muted-foreground/40" />
          <p className="text-sm">Select a subject to see your mastery heatmap</p>
        </div>
      )}

      {selectedSubject && !compsErr && topics.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
          <HugeiconsIcon icon={ChartBarBigIcon} className="size-10 text-muted-foreground/40" />
          <p className="text-sm">
            No competency data yet. Complete some quizzes to build your heatmap.
          </p>
        </div>
      )}

      {selectedSubject && topics.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th scope="col" className="w-40 p-2 text-left font-medium text-muted-foreground">
                    Topic
                  </th>
                  {BLOOM_ORDER.map((bloom) => (
                    <th
                      key={bloom}
                      scope="col"
                      className="min-w-20 p-2 text-center font-medium text-muted-foreground capitalize"
                    >
                      {bloom}
                    </th>
                  ))}
                  <th
                    scope="col"
                    className="min-w-20 p-2 text-center font-medium text-muted-foreground"
                  >
                    Overall
                  </th>
                </tr>
              </thead>
              <tbody>
                {topics.map((topic) => {
                  const overall = overallByTopic.get(topic);
                  return (
                    <tr key={topic} className="border-border/40 border-t">
                      <td className="max-w-40 truncate p-2 font-medium text-sm" title={topic}>
                        {topic}
                      </td>
                      {BLOOM_ORDER.map((bloom) => {
                        const rec = compMap.get(`${topic}:${bloom}`);
                        return (
                          <td key={bloom} className="p-1">
                            {rec ? (
                              <div
                                className={cn(
                                  "rounded px-2 py-1.5 text-center font-medium font-mono text-xs",
                                  LEVEL_BG[rec.level] || "bg-muted",
                                )}
                                title={`${rec.score}% — ${rec.attempts} attempts`}
                              >
                                <span className="tabular-nums">{rec.score}%</span>
                              </div>
                            ) : (
                              <div className="rounded px-2 py-1.5 text-center text-muted-foreground/30">
                                -
                              </div>
                            )}
                          </td>
                        );
                      })}
                      <td className="p-1">
                        {overall && (
                          <div
                            className={cn(
                              "rounded px-2 py-1.5 text-center font-mono font-semibold text-xs",
                              LEVEL_COLORS[overall.avgLevel],
                            )}
                          >
                            {overall.avgScore}%
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-4 pt-2 text-muted-foreground text-xs">
            <span className="flex items-center gap-1">
              <span className="size-3 rounded bg-destructive/15" /> Novice
            </span>
            <span className="flex items-center gap-1">
              <span className="size-3 rounded bg-warning/15" /> Developing
            </span>
            <span className="flex items-center gap-1">
              <span className="size-3 rounded bg-success/15" /> Proficient
            </span>
            <span className="flex items-center gap-1">
              <span className="size-3 rounded bg-info/15" /> Mastered
            </span>
          </div>
        </>
      )}
    </div>
  );
}
