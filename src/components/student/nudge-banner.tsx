"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  BookOpen,
  Target,
  Clock,
  ChevronRight,
  X,
  Bell,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";

interface Nudge {
  id: string;
  type:
    | "streak_break"
    | "competency_decay"
    | "ease_hell"
    | "exam_gap"
    | "duration_drop"
    | "engagement_drop";
  title: string;
  message: string;
  severity: "low" | "medium" | "high" | "critical";
  actionLabel: string;
  actionUrl: string;
  dismissible: boolean;
  createdAt: number;
  actionTaken?: boolean;
}

interface StudentNudgeProps {
  className?: string;
}

export function StudentNudgeBanner({ className }: StudentNudgeProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [activeNudge, setActiveNudge] = useState<Nudge | null>(null);
  const queryClient = useQueryClient();

  const { data: nudges = [], isLoading } = useQuery<Nudge[]>({
    queryKey: ["student-nudges"],
    queryFn: async () => {
      const res = await fetch("/api/student/nudges");
      if (!res.ok) return [];
      return res.json() as Promise<Nudge[]>;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 60 * 1000, // Refetch every 30 minutes
  });

  const dismissMutation = useMutation({
    mutationFn: async (nudgeId: string) => {
      await fetch(`/api/student/nudges/${nudgeId}/dismiss`, { method: "POST" });
    },
    onSuccess: (_, nudgeId) => {
      setDismissedIds((prev) => new Set(prev).add(nudgeId));
      queryClient.invalidateQueries({ queryKey: ["student-nudges"] });
    },
  });

  const actionMutation = useMutation({
    mutationFn: async ({ nudgeId, action }: { nudgeId: string; action: string }) => {
      await fetch(`/api/student/nudges/${nudgeId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
    },
    onSuccess: (_, { nudgeId }) => {
      queryClient.invalidateQueries({ queryKey: ["student-nudges"] });
    },
  });

  // Filter out dismissed nudges
  const visibleNudges = useMemo(
    () => (nudges as Nudge[]).filter((n: Nudge) => !dismissedIds.has(n.id) && !n.actionTaken),
    [nudges, dismissedIds],
  );

  // Find highest priority nudge to show
  const priorityOrder = useMemo(() => ({ critical: 4, high: 3, medium: 2, low: 1 }), []);
  const topNudge = useMemo(
    () =>
      (nudges as Nudge[])
        .filter((n: Nudge) => !dismissedIds.has(n.id) && !n.actionTaken)
        .filter(
          (_: Nudge, i: number, arr: Nudge[]) =>
            arr.indexOf(arr.find((n: Nudge) => !n.actionTaken)!) === i,
        )
        .toSorted(
          (a: Nudge, b: Nudge) => priorityOrder[b.severity] - priorityOrder[a.severity],
        )[0] || null,
    [nudges, dismissedIds, priorityOrder],
  );

  // Update active nudge
  useEffect(() => {
    if (topNudge && topNudge !== activeNudge) {
      setActiveNudge(topNudge);
    }
  }, [topNudge, activeNudge]);

  if (isLoading || !activeNudge) return null;

  const severityColors = {
    critical:
      "bg-red-50 border-red-200 text-red-900 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200",
    high: "bg-orange-50 border-orange-200 text-orange-900 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-200",
    medium:
      "bg-yellow-50 border-yellow-200 text-yellow-900 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200",
    low: "bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200",
  };

  const iconMap = {
    streak_break: <HugeiconsIcon icon={AlertTriangle} className="h-5 w-5" />,
    competency_decay: <HugeiconsIcon icon={BookOpen} className="h-5 w-5" />,
    ease_hell: <HugeiconsIcon icon={Target} className="h-5 w-5" />,
    exam_gap: <HugeiconsIcon icon={Clock} className="h-5 w-5" />,
    duration_drop: <HugeiconsIcon icon={Clock} className="h-5 w-5" />,
    engagement_drop: <HugeiconsIcon icon={AlertTriangle} className="h-5 w-5" />,
  };

  const handleDismiss = () => {
    setDismissedIds((prev) => new Set(prev).add(activeNudge.id));
    setActiveNudge(null);
  };

  const handleAction = () => {
    window.location.href = activeNudge.actionUrl;
  };

  return (
    <div
      className={cn("fixed bottom-4 right-4 z-50 max-w-md w-full animate-slide-up", className)}
      role="alert"
      aria-live="polite"
    >
      <div
        className={cn(
          "rounded-xl border shadow-xl p-4 backdrop-blur-sm",
          activeNudge.severity === "critical" &&
            "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800",
          activeNudge.severity === "high" &&
            "bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800",
          activeNudge.severity === "medium" &&
            "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800",
          activeNudge.severity === "low" &&
            "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800",
        )}
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex-shrink-0 p-2 rounded-lg",
              activeNudge.severity === "critical" &&
                "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
              activeNudge.severity === "high" &&
                "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
              activeNudge.severity === "medium" &&
                "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400",
              activeNudge.severity === "low" &&
                "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
            )}
          >
            {activeNudge.type &&
              (activeNudge.type in iconMap ? (
                iconMap[activeNudge.type as keyof typeof iconMap]
              ) : (
                <HugeiconsIcon icon={Bell} className="h-5 w-5" />
              ))}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-sm">{activeNudge.title}</h4>
              <span
                className={cn(
                  "px-2 py-0.5 text-xs font-medium rounded-full",
                  activeNudge.severity === "critical" &&
                    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
                  activeNudge.severity === "high" &&
                    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
                  activeNudge.severity === "medium" &&
                    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
                  activeNudge.severity === "low" &&
                    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
                )}
              >
                {activeNudge.severity.toUpperCase()}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{activeNudge.message}</p>

            <div className="mt-3 flex items-center gap-2">
              <Button
                size="sm"
                variant="default"
                onClick={() => (window.location.href = activeNudge.actionUrl)}
                className="gap-1"
              >
                <span>{activeNudge.actionLabel}</span>
                <HugeiconsIcon icon={ChevronRight} className="h-3 w-3" />
              </Button>
              <button
                onClick={() => {
                  setDismissedIds((prev) => new Set(prev).add(activeNudge.id));
                  setActiveNudge(null);
                }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <HugeiconsIcon icon={X} className="h-3 w-3" />
                <span className="hidden sm:inline">Dismiss</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
