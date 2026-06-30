"use client";

import { FadeIn } from "@/components/shared/fade-in";
import { getAPSForSubject, getGrade } from "@/lib/shared/aps";
import { cn } from "@/lib/utils";

interface Subject {
  id: string;
  name: string;
  percentage: number;
}

interface SubjectBreakdownProps {
  subjects: Subject[];
}

export function SubjectBreakdown({ subjects }: SubjectBreakdownProps) {
  const filtered = subjects.filter((s) => s.percentage > 0);
  if (filtered.length === 0) return null;

  return (
    <div className="px-5 pb-5">
      <p className="mb-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">
        Subject Breakdown
      </p>
      <div className="flex flex-col gap-2">
        {filtered
          .toSorted((a, b) => getAPSForSubject(b.percentage) - getAPSForSubject(a.percentage))
          .map((subject, idx) => {
            const aps = getAPSForSubject(subject.percentage);
            return (
              <FadeIn
                key={subject.id}
                direction="up"
                distance={10}
                delay={idx * 0.05}
                className="relative flex items-center justify-between overflow-hidden rounded-xl bg-system-background-secondary p-4"
              >
                <div
                  className={cn(
                    "absolute top-0 bottom-0 left-0 w-1.5",
                    aps >= 6 && "bg-success",
                    aps >= 4 && aps < 6 && "bg-warning",
                    aps < 4 && "bg-destructive",
                  )}
                />
                <div className="pl-3">
                  <span className="font-medium text-sm">
                    {subject.name || `Subject ${idx + 1}`}
                  </span>
                  <span className="ml-2 text-muted-foreground text-sm tabular-nums">
                    ({subject.percentage}%)
                  </span>
                </div>
                <div className="text-right">
                  <span
                    className={cn(
                      "font-extrabold tabular-nums",
                      aps >= 6 && "text-success",
                      aps >= 4 && aps < 6 && "text-warning",
                      aps < 4 && "text-destructive",
                    )}
                  >
                    {aps} pts
                  </span>
                  <span className="ml-2 block text-muted-foreground text-xs">
                    {getGrade(subject.percentage)}
                  </span>
                </div>
              </FadeIn>
            );
          })}
      </div>
    </div>
  );
}
