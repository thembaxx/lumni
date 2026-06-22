"use client";

import Calendar01Icon from "@hugeicons/core-free-icons/Calendar01Icon";
import Clock01Icon from "@hugeicons/core-free-icons/Clock01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import * as m from "motion/react-m";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { StudySession } from "./schedule-generator";

const DAYS_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function getTypeColor(type: string) {
  switch (type) {
    case "new":
      return "bg-[--system-accent]/10 text-muted-foreground";
    case "review":
      return "bg-accent/20 text-accent";
    case "practice":
      return "bg-success/20 text-success";
    default:
      return "bg-muted/50 text-muted-foreground";
  }
}

export function ScheduleView({
  schedule,
  onReset,
}: {
  schedule: StudySession[];
  onReset: () => void;
}) {
  const scheduleByDay = DAYS_ORDER.map((day) => ({
    day,
    sessions: schedule.filter((s) => s.day === day),
  }));

  return (
    <div className="flex-1 overflow-y-auto px-5 pb-10">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">Your Study Plan</h3>
        <Button variant="outline" size="sm" onClick={onReset} className="rounded-xl">
          Reset
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        {scheduleByDay.flatMap((day, idx) =>
          day.sessions.length > 0
            ? [
                <m.div
                  key={day.day}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <h4 className="mb-2 flex items-center gap-2 font-medium text-foreground text-sm">
                    <HugeiconsIcon
                      icon={Calendar01Icon}
                      className="size-4 text-[--system-accent]"
                    />
                    {day.day}
                  </h4>
                  <div className="flex flex-col gap-2">
                    {day.sessions.map((session) => (
                      <div
                        key={`${day.day}-${session.subject}-${session.topic}-${session.duration}-${session.type}`}
                        className={cn(
                          "rounded-xl border border-border bg-card p-3 shadow-level-1",
                          session.subject === "Break" && "bg-muted/50",
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-sm">{session.subject}</span>
                            <span className="ml-2 text-muted-foreground text-sm">
                              - {session.topic}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "rounded-lg px-2.5 py-0.5 text-[10px] capitalize",
                                getTypeColor(session.type),
                              )}
                            >
                              {session.type}
                            </span>
                            <span className="flex items-center gap-1 text-muted-foreground text-sm tabular-nums">
                              <HugeiconsIcon icon={Clock01Icon} className="size-3" />
                              {session.duration}min
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </m.div>,
              ]
            : [],
        )}
      </div>
    </div>
  );
}
