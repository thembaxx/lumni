"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useEnrolledSubjects } from "@/hooks/use-subjects";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import type { CompetencyRecord } from "@/lib/competency-engine/types";
import type { KnowledgeGraph, KnowledgeNode } from "@/lib/knowledge-graph/types";
import { MASTERY_COLORS, LAYER_KEYS } from "@/lib/knowledge-graph/visual-constants";
import {
  LAYOUT,
  getSvgDimensions,
  getNodeX,
  getNodeY,
  getNodeCenter,
  getNodeStyle,
} from "@/lib/knowledge-graph/svg-layout";

export function LearningMapCard() {
  const { push } = useRouter();
  const { isAnonymous } = useAuth();
  const { enrolledSubjects } = useEnrolledSubjects();
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  const subjectForQuery = selectedSubject ?? enrolledSubjects[0]?.name;

  const {
    data: graph,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["knowledge-graph", subjectForQuery],
    queryFn: async () => {
      const params = new URLSearchParams({
        subject: subjectForQuery ?? "",
        topic: subjectForQuery ?? "",
      });
      const res = await fetch(`/api/engine/knowledge-graph?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json() as Promise<KnowledgeGraph>;
    },
    enabled: !!subjectForQuery,
  });

  const { data: competencies } = useQuery({
    queryKey: ["competencies", subjectForQuery],
    queryFn: async () => {
      const res = await fetch(
        `/api/engine/competencies?subject=${encodeURIComponent(subjectForQuery ?? "")}`,
      );
      if (!res.ok) return [];
      const data = await res.json();
      return (data.competencies ?? []) as CompetencyRecord[];
    },
    enabled: !!subjectForQuery,
    staleTime: 60_000,
  });

  const masteryMap = useMemo(() => {
    const map = new Map<string, string>();
    const bestScoreByTopic = new Map<string, number>();
    if (!competencies) return map;
    for (const c of competencies) {
      const existing = map.get(c.topicId);
      const prevBest = bestScoreByTopic.get(c.topicId) ?? 0;
      if (!existing || c.score > prevBest) {
        map.set(c.topicId, c.level);
        bestScoreByTopic.set(c.topicId, c.score);
      }
    }
    return map;
  }, [competencies]);

  const { nodeMap, layers } = useMemo(() => {
    const map = new Map<string, KnowledgeNode>();
    const l = {
      prerequisite: [] as KnowledgeNode[],
      core: [] as KnowledgeNode[],
      advanced: [] as KnowledgeNode[],
    };
    if (graph) {
      for (const node of graph.nodes) {
        map.set(node.id, node);
        if (node.type in l) {
          l[node.type as keyof typeof l].push(node);
        }
      }
    }
    return { nodeMap: map, layers: l };
  }, [graph]);

  if (isAnonymous || enrolledSubjects.length === 0) return null;

  if (isPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-extrabold text-sm tracking-tight">Learning Map</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !graph || graph.nodes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-extrabold text-sm tracking-tight">Learning Map</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-xs">Could not load</p>
        </CardContent>
      </Card>
    );
  }

  const maxNodes = Math.max(
    layers.prerequisite.length,
    layers.core.length,
    layers.advanced.length,
    1,
  );

  const { svgW, svgH } = getSvgDimensions(maxNodes);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-extrabold text-sm tracking-tight">Learning Map</CardTitle>
        {enrolledSubjects.length > 1 && (
          <Select
            value={subjectForQuery ?? ""}
            onValueChange={(value) => setSelectedSubject(value)}
          >
            <SelectTrigger className="h-6 w-auto min-w-[100px] text-(--fs-caption-3)" size="sm">
              <SelectValue placeholder="Subject" />
            </SelectTrigger>
            <SelectContent>
              {enrolledSubjects.map((s) => (
                <SelectItem key={s.name} value={s.name}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <svg
            viewBox={`0 0 ${svgW} ${svgH}`}
            className="w-full max-w-full"
            style={{ minWidth: svgW, minHeight: svgH }}
            role="img"
            aria-label="Knowledge graph showing prerequisite, core, and advanced topics colored by mastery level"
          >
            {graph.edges.map((edge) => {
              const fromNode = nodeMap.get(edge.from);
              const toNode = nodeMap.get(edge.to);
              if (!fromNode || !toNode) return null;
              const fromType = fromNode.type as keyof typeof layers;
              const toType = toNode.type as keyof typeof layers;
              const fromLayer = LAYER_KEYS.indexOf(fromNode.type as (typeof LAYER_KEYS)[number]);
              const toLayer = LAYER_KEYS.indexOf(toNode.type as (typeof LAYER_KEYS)[number]);
              const fromIdx = layers[fromType].indexOf(fromNode);
              const toIdx = layers[toType].indexOf(toNode);
              const from = getNodeCenter(fromLayer, fromIdx, layers[fromType].length, svgW);
              const to = getNodeCenter(toLayer, toIdx, layers[toType].length, svgW);
              const midY = (from.y + to.y) / 2;
              const d = `M ${from.x} ${from.y} Q ${from.x} ${midY} ${from.x + (to.x - from.x) / 2} ${midY} T ${to.x} ${to.y}`;
              return (
                <path
                  key={edge.from + edge.to}
                  d={d}
                  fill="none"
                  stroke="currentColor"
                  className="text-border/60"
                  strokeWidth={1.5}
                />
              );
            })}
            {graph.nodes.map((node) => {
              const rowIndex = LAYER_KEYS.indexOf(node.type as (typeof LAYER_KEYS)[number]);
              const row = layers[node.type];
              const nodeIndex = row.indexOf(node);
              const _x = getNodeX(nodeIndex, row.length, svgW);
              const _y = getNodeY(rowIndex);
              const style = getNodeStyle(node.id, node.type, masteryMap);
              return (
                <a
                  key={node.id}
                  className="cursor-pointer"
                  tabIndex={0}
                  href={`/quiz?subject=${encodeURIComponent(subjectForQuery ?? "")}&topic=${encodeURIComponent(node.label)}`}
                  aria-label={`Practice ${node.label}`}
                  onKeyDown={(e) => {
                    if (
                      (e as React.KeyboardEvent).key === "Enter" ||
                      (e as React.KeyboardEvent).key === " "
                    ) {
                      push(
                        `/quiz?subject=${encodeURIComponent(subjectForQuery ?? "")}&topic=${encodeURIComponent(node.label)}`,
                      );
                    }
                  }}
                >
                  <rect
                    x={_x}
                    y={_y}
                    width={LAYOUT.nodeW}
                    height={LAYOUT.nodeH}
                    rx={6}
                    className={style.fillClass}
                    fillOpacity={0.15}
                    strokeWidth={1.5}
                  />
                  <foreignObject x={_x} y={_y} width={LAYOUT.nodeW} height={LAYOUT.nodeH}>
                    <div className="flex h-full items-center justify-center px-1">
                      <span
                        className="truncate text-center font-medium text-(--fs-caption-3) leading-tight"
                        style={{ color: style.textColor }}
                      >
                        {node.label}
                      </span>
                    </div>
                  </foreignObject>
                </a>
              );
            })}
          </svg>
          {competencies && competencies.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-3 text-(--fs-caption-3)">
              {Object.entries(MASTERY_COLORS).map(([level, colors]) => (
                <span key={level} className="flex items-center gap-1">
                  <span
                    className="inline-block size-2 rounded-full"
                    style={{ backgroundColor: colors.text }}
                  />
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </span>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
