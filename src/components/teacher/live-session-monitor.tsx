"use client";

import Refresh01Icon from "@hugeicons/core-free-icons/Refresh01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface SessionData {
  $id: string;
  groupId: string;
  startedBy: string;
  startedByName?: string;
  subject?: string;
  status: "active" | "ended";
  startedAt: string;
}

function getDuration(startedAt: string): number {
  return Math.floor((Date.now() - new Date(startedAt).getTime()) / 60000);
}

function getDurationLabel(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function getColorClass(minutes: number): string {
  if (minutes >= 10) return "border-(--system-success)/30 bg-(--system-success)/5";
  if (minutes >= 5) return "border-(--system-warning)/30 bg-(--system-warning)/5";
  return "border-muted-foreground/30 bg-muted/30";
}

export function LiveSessionMonitor() {
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["teacher-live-sessions"],
    queryFn: async () => {
      const res = await fetch("/api/teacher/live-sessions");
      if (!res.ok) throw new Error("Failed to fetch live sessions");
      const json = (await res.json()) as { sessions: SessionData[] };
      return json.sessions ?? [];
    },
    refetchInterval: 30_000,
  });

  const sessions = data ?? [];

  const formatTime = useCallback((iso: string) => {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-semibold text-lg">Live Study Sessions</h2>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="h-8 gap-1.5 text-xs"
        >
          <HugeiconsIcon
            icon={Refresh01Icon}
            className={cn(isRefetching && "animate-spin")}
            data-icon="inline-start"
          />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      ) : isError ? (
        <p className="text-destructive text-sm" role="status">
          Failed to load live sessions
        </p>
      ) : sessions.length === 0 ? (
        <p className="py-6 text-center text-muted-foreground text-sm" role="status">
          No active study sessions from your students
        </p>
      ) : (
        <div className="flex flex-col gap-2" aria-live="polite">
          {sessions.map((session) => {
            const mins = getDuration(session.startedAt);
            return (
              <div
                key={session.$id}
                className={cn(
                  "flex items-center justify-between rounded-xl border p-3",
                  getColorClass(mins),
                )}
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <p className="truncate font-medium text-sm">
                    {session.subject || "Study Session"}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Started by {session.startedByName || "Someone"} at{" "}
                    {formatTime(session.startedAt)}
                  </p>
                </div>
                <span className="shrink-0 text-muted-foreground text-xs">
                  {getDurationLabel(mins)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
