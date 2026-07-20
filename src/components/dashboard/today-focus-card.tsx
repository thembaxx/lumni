"use client";

import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon";
import CheckmarkCircle01Icon from "@hugeicons/core-free-icons/CheckmarkCircle01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { memo, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFilteredSubjects } from "@/hooks/use-subjects";
import { useRouter } from "@/i18n/navigation";
import { SubjectsDrawer } from "./drawers/subjects-drawer";

const FALLBACK = {
  subject: "Physical Sciences",
  topic: "Chemical Bonding & Molecular Structure",
  reason: "Pick a subject to find your focus area.",
  action: "Practice now",
  tag: "Needs work",
  accent: "bg-destructive",
  iconColor: "text-destructive",
  bgAlpha: "bg-destructive/15",
};

const actionConfig: Record<
  string,
  {
    tag: string;
    accent: string;
    iconColor: string;
    bgAlpha: string;
    action: string;
  }
> = {
  study: {
    tag: "Ready to start",
    accent: "bg-info",
    iconColor: "text-info",
    bgAlpha: "bg-info/15",
    action: "Study",
  },
  practice: {
    tag: "Needs work",
    accent: "bg-destructive",
    iconColor: "text-destructive",
    bgAlpha: "bg-destructive/15",
    action: "Practice now",
  },
  review: {
    tag: "Due for review",
    accent: "bg-warning",
    iconColor: "text-warning",
    bgAlpha: "bg-warning/15",
    action: "Start review",
  },
};

export const TodayFocusCard = memo(function TodayFocusCard() {
  const { push } = useRouter();
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const { data: subjects } = useFilteredSubjects("");
  const subjectNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of subjects ?? []) {
      map.set(s.id, s.name);
    }
    return map;
  }, [subjects]);

  const { data: nextTopics } = useQuery({
    queryKey: ["next-topics", selectedSubjectId],
    queryFn: async () => {
      const res = await fetch(
        `/api/engine/next-topics?subject=${encodeURIComponent(selectedSubjectId ?? "")}`,
      );
      if (!res.ok) throw new Error("Failed to fetch focus");
      return res.json() as Promise<{
        recommendations: {
          topicId: string;
          name: string;
          level: string;
          reason: string;
          action: string;
          estimatedMinutes: number;
        }[];
      }>;
    },
    enabled: !!selectedSubjectId,
    staleTime: 1000 * 60 * 5,
  });

  const active = (nextTopics?.recommendations ?? []).find((r) => r.action !== "skip");

  const cfg = active ? (actionConfig[active.action] ?? actionConfig.study) : FALLBACK;
  const subjectName = selectedSubjectId
    ? (subjectNameById.get(selectedSubjectId) ?? selectedSubjectId)
    : FALLBACK.subject;
  const topic = active?.name ?? FALLBACK.topic;
  const reason = active
    ? active.reason === "ready-to-start"
      ? "You're ready for this topic. Give it a try."
      : active.reason === "needs-practice"
        ? "Needs more practice to reach proficiency. Keep at it!"
        : "Time to review this topic and lock it in."
    : FALLBACK.reason;

  function handleStart() {
    setShowSuccess(true);
    setTimeout(() => {
      push(
        `/quiz?subject=${encodeURIComponent(subjectName)}&topic=${encodeURIComponent(topic)}&count=10`,
      );
    }, 600);
  }

  useEffect(() => {
    if (showSuccess) {
      const t = setTimeout(() => setShowSuccess(false), 600);
      return () => clearTimeout(t);
    }
  }, [showSuccess]);

  return (
    <div className="card-entrance-sm">
      <Card className="border border-border/80 transition-colors hover:border-foreground/15">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div
              className={`flex size-10 items-center justify-center rounded-xl border ${cfg.bgAlpha}`}
            >
              <HugeiconsIcon icon={CheckmarkCircle01Icon} className={`size-5 ${cfg.iconColor}`} />
            </div>
            <div className="flex flex-col gap-0.5">
              <CardTitle className="font-bold text-foreground text-sm text-balance tracking-tight">
                Today&apos;s Focus
              </CardTitle>
              <span className={`font-medium text-xs ${cfg.iconColor}`}>{cfg.tag}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-primary text-sm">{subjectName}</p>
            <SubjectsDrawer
              onSelect={(name) => {
                const found = subjects?.find((s) => s.name === name);
                if (found) setSelectedSubjectId(found.id);
              }}
            >
              <div
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    (e.currentTarget as HTMLElement).click();
                  }
                }}
                className="flex min-h-11 cursor-pointer items-center gap-1 rounded-lg border px-3 py-1.5 font-medium text-muted-foreground text-xs transition-[background-color,color,transform] hover:bg-system-fill hover:text-foreground press-scale focus-visible:ring-2 focus-visible:ring-primary"
              >
                Change subject
                <HugeiconsIcon icon={ArrowDown01Icon} className="ml-2 size-4" />
              </div>
            </SubjectsDrawer>
          </div>
          <h3 className="text-balance font-semibold text-foreground text-lg leading-tight tracking-tight">
            {topic}
          </h3>
          <p className="font-medium text-muted-foreground text-xs leading-relaxed text-pretty">
            {reason}
          </p>
          <Button
            size="sm"
            variant="secondary"
            className="w-full bg-system-fill font-bold text-sm transition-[scale,background-color,box-shadow,color,opacity,transform] hover:opacity-90 press-scale"
            onClick={handleStart}
            disabled={showSuccess}
          >
            {showSuccess ? (
              <span className="card-entrance flex items-center gap-1.5">
                <HugeiconsIcon icon={CheckmarkCircle01Icon} data-icon="inline-start" />
                Starting quiz&hellip;
              </span>
            ) : (
              <span className="card-entrance">{cfg.action}</span>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
});
