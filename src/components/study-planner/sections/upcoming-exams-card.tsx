"use client";

import BookOpen01Icon from "@hugeicons/core-free-icons/BookOpen01Icon";
import Delete02Icon from "@hugeicons/core-free-icons/Delete02Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { ExamDate as ExamDateType } from "@/lib/utils/study-planner";

export function UpcomingExamsCard({
  exams,
  onDelete,
}: {
  exams: ExamDateType[];
  onDelete: (id: string) => void;
}) {
  const t = useTranslations();
  return (
    <div className="overflow-hidden rounded-card-lg border border-border/80 bg-card shadow-level-2 transition-colors">
      <header className="rounded-t-card-lg border-border/80 border-t pb-2">
        <h2 className="flex items-center gap-2 font-medium font-sans text-base">
          <HugeiconsIcon icon={BookOpen01Icon} className="size-4" />
          {t("studyPlanner.upcomingExams")}
        </h2>
      </header>
      <div className="px-4 group-data-[size=sm]/card:px-3">
        {exams.length === 0 ? (
          <p className="py-4 text-center text-muted-foreground text-sm">
            {t("studyPlanner.noExams")}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {exams.map((exam) => (
              <div
                key={exam.id}
                className="flex items-center justify-between rounded-lg bg-muted p-3"
              >
                <div>
                  <p className="font-medium text-sm">{exam.subject}</p>
                  <p className="text-muted-foreground text-xs">
                    {t("studyPlanner.daysLeft", {
                      paper: exam.paper,
                      days: exam.daysUntil,
                    })}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => onDelete(exam.id)}
                  aria-label={t("studyPlanner.deleteSession")}
                >
                  <HugeiconsIcon icon={Delete02Icon} className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
