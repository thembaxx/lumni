"use client";

import BookOpen01Icon from "@hugeicons/core-free-icons/BookOpen01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFilteredSubjects } from "@/hooks/use-subjects";
import { useRouter } from "@/i18n/navigation";

export function StudyCard() {
  const { push } = useRouter();
  const { subjects } = useFilteredSubjects("", true);

  if (subjects.length === 0) return null;

  const first = subjects[0];

  return (
    <div className="card-entrance">
      <Card
        className="cursor-pointer overflow-hidden rounded-card shadow-level-1 transition-[scale,box-shadow,background-color,transform] duration-300 hover:bg-muted/50 press-scale"
        onClick={() => push("/dashboard")}
        role="button"
        tabIndex={0}
        aria-label={`Start studying ${first.name}`}
      >
        <CardHeader>
          <CardTitle className="font-bold text-lg text-balance">Continue Studying</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4 p-5 pt-0">
          <div className="flex size-12 items-center justify-center rounded-card bg-(--system-accent)/10">
            <HugeiconsIcon icon={BookOpen01Icon} className="size-6 text-system-accent" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm">{first.name}</span>
            <span className="text-muted-foreground text-xs">
              {subjects.length} subject{subjects.length !== 1 ? "s" : ""} available
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
