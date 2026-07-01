"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { StudySession } from "@/lib/utils/study-planner";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function buildMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay();
  const totalDays = lastDay.getDate();
  const cells: (number | null)[] = [];

  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);

  return cells;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getSessionsForDay(sessions: StudySession[], year: number, month: number, day: number) {
  const date = new Date(year, month, day);
  return sessions.filter((s) => {
    const sd = new Date(s.scheduledAt);
    return isSameDay(sd, date);
  });
}

interface CalendarViewProps {
  sessions: StudySession[];
  onUpdateSession: (id: string, updates: Partial<StudySession>) => void;
}

export function CalendarView({ sessions, onUpdateSession }: CalendarViewProps) {
  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(() => today.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => today.getMonth());
  const dragTargetRef = useRef<string | null>(null);

  const grid = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  const prevMonth = useCallback(() => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  }, [viewMonth]);

  const nextMonth = useCallback(() => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  }, [viewMonth]);

  const handleDrop = useCallback(
    (day: number) => {
      const id = dragTargetRef.current;
      if (id === null) return;
      const newDate = new Date(viewYear, viewMonth, day);
      newDate.setHours(9, 0, 0, 0);
      onUpdateSession(id, { scheduledAt: newDate.getTime() });
      dragTargetRef.current = null;
    },
    [viewYear, viewMonth, onUpdateSession],
  );

  const handleDragStart = useCallback((e: React.DragEvent, sessionId: string) => {
    e.dataTransfer.setData("text/plain", sessionId);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Calendar</CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={prevMonth} aria-label="Previous month">
              ←
            </Button>
            <span className="min-w-36 text-center font-medium text-sm">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <Button variant="ghost" size="sm" onClick={nextMonth} aria-label="Next month">
              →
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-px">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="py-1 text-center font-medium text-(--fs-caption-3) text-muted-foreground uppercase tracking-wider"
            >
              {d}
            </div>
          ))}
          {grid.map((day, i) => {
            if (day === null) {
              return (
                // biome-ignore lint/suspicious/noArrayIndexKey: static grid
                <div key={`pad-${i}`} className="min-h-15" />
              );
            }
            const daySessions = getSessionsForDay(sessions, viewYear, viewMonth, day);
            const isToday = isSameDay(new Date(viewYear, viewMonth, day), today);

            return (
              // biome-ignore lint/a11y/noStaticElementInteractions: drag only, no keyboard
              <div
                key={`day-${day}`}
                className={cn(
                  "min-h-15 rounded-md border p-1 text-xs transition-colors",
                  isToday && "border-primary bg-primary/5",
                )}
                onDragOver={handleDragOver}
                onDrop={(e) => {
                  const id = e.dataTransfer.getData("text/plain");
                  if (id) {
                    dragTargetRef.current = id;
                    handleDrop(day);
                  }
                }}
              >
                <div className={cn("mb-1 font-medium tabular-nums", isToday && "text-primary")}>
                  {day}
                </div>
                {daySessions.slice(0, 3).map((s) => (
                  // biome-ignore lint/a11y/noStaticElementInteractions: draggable only
                  <div
                    key={s.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, s.id)}
                    onDragEnd={() => {
                      dragTargetRef.current = null;
                    }}
                    className={cn(
                      "mb-px cursor-grab truncate rounded px-1 text-(--fs-caption-3) leading-4 transition-shadow active:cursor-grabbing",
                      s.completed
                        ? "bg-success/20 text-success"
                        : s.type === "flashcard"
                          ? "bg-(--system-accent)/10 text-(--system-accent) font-semibold"
                          : "bg-(--system-accent)/10 text-(--system-accent)",
                    )}
                    title={`${s.subject}${s.topic ? ` - ${s.topic}` : ""}${s.type === "flashcard" ? " (Flashcard Review)" : ""}`}
                  >
                    {s.type === "flashcard" ? `FC ${s.subject}` : s.subject}
                  </div>
                ))}
                {daySessions.length > 3 && (
                  <div className="text-(--fs-caption-3) text-muted-foreground">
                    +{daySessions.length - 3}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-center text-(--fs-caption-3) text-muted-foreground">
          Drag sessions to reschedule
        </p>
      </CardContent>
    </Card>
  );
}
