"use client";

import Calendar01Icon from "@hugeicons/core-free-icons/Calendar01Icon";
import Clock01Icon from "@hugeicons/core-free-icons/Clock01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import type { StudySession } from "@/lib/utils/study-planner";

interface StudySessionListProps {
  sessions: StudySession[];
  onStartSession: (session: StudySession) => void;
  completedSessions?: number;
  studyTimeMinutes?: number;
  progress?: number;
}

export function StudySessionList({
  sessions,
  onStartSession,
  completedSessions = 0,
  studyTimeMinutes = 0,
  progress = 0,
}: StudySessionListProps) {
  return (
    <>
      {sessions.length > 0 ? (
        sessions.slice(0, 3).map((session) => (
          <button
            type="button"
            key={session.id}
            onClick={() => onStartSession(session)}
            className="flex w-full items-center gap-3 rounded-xl bg-muted/30 p-2.5 text-left transition-colors hover:bg-muted/50"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-system-accent/10">
              <HugeiconsIcon icon={Clock01Icon} className="size-4 text-system-accent" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-sm">{session.subject}</p>
              <p className="text-muted-foreground text-xs">
                {session.topic || session.type} · {session.duration} min
              </p>
            </div>
            {session.completed && <span className="font-medium text-success text-xs">Done</span>}
          </button>
        ))
      ) : (
        <div className="flex items-center gap-3 rounded-xl bg-muted/30 p-2.5">
          <HugeiconsIcon icon={Calendar01Icon} className="size-4 text-muted-foreground" />
          <p className="text-muted-foreground text-sm">No sessions scheduled today</p>
        </div>
      )}
      {completedSessions > 0 && (
        <>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-system-accent transition-[width]"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <span className="shrink-0 font-medium text-muted-foreground text-xs tabular-nums">
              {progress}%
            </span>
          </div>
          <p className="pt-1 text-muted-foreground text-xs">
            {completedSessions} session
            {completedSessions !== 1 ? "s" : ""} completed · {studyTimeMinutes} min studied
          </p>
        </>
      )}
    </>
  );
}
