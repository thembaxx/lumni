"use client";

import Calendar03Icon from "@hugeicons/core-free-icons/Calendar03Icon";
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getNextExams, formatFriendlyDate, formatTimeRange } from "@/lib/exam-dates/service";
import { getCurrentSession } from "@/lib/exam-dates";

export function UpcomingExamCard() {
  const { session, year } = getCurrentSession();

  const { data: nextExams, isLoading } = useQuery({
    queryKey: ["upcoming-exams", session, year],
    queryFn: () => getNextExams(session, year, 1),
    staleTime: 1000 * 60 * 30,
  });

  const nextExam = useMemo(() => nextExams?.[0] ?? null, [nextExams]);

  const countdownText = useMemo(() => {
    if (!nextExam) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const examDate = new Date(`${nextExam.date}T00:00:00`);
    const diffMs = examDate.getTime() - now.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `Ended ${Math.abs(diffDays)}d ago`;
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    return `Starts in ${diffDays} days`;
  }, [nextExam]);

  const countdownVariant = useMemo(() => {
    if (!countdownText) return "bg-muted text-muted-foreground";
    if (countdownText.startsWith("Starts in") && parseInt(countdownText) <= 7)
      return "bg-warning/15 text-warning";
    if (countdownText.startsWith("Today") || countdownText.startsWith("Tomorrow"))
      return "bg-success/15 text-success";
    if (countdownText.startsWith("Ended")) return "bg-muted text-muted-foreground";
    return "bg-muted text-muted-foreground";
  }, [countdownText]);

  if (isLoading) {
    return (
      <Card className="flex flex-col gap-3 p-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-4 w-32" />
      </Card>
    );
  }

  if (!nextExam) {
    return (
      <Card className="flex flex-col gap-2 p-4">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={Calendar03Icon} className="size-5 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Upcoming Exams</h3>
        </div>
        <p className="text-muted-foreground text-xs">No upcoming exams scheduled</p>
      </Card>
    );
  }

  return (
    <Card className="group flex flex-col gap-3 p-4 transition-[scale,box-shadow,background-color,transform] duration-300 press-scale">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={Calendar03Icon} className="size-5 text-accent" />
          <h3 className="font-semibold text-sm">Upcoming Exam</h3>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${countdownVariant}`}>
          {countdownText}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <span className="font-medium text-sm">
          {nextExam.subject} Paper {nextExam.paperNumber}
        </span>
        <span className="text-muted-foreground text-xs">{formatFriendlyDate(nextExam.date)}</span>
        <span className="text-muted-foreground text-xs">
          {formatTimeRange(nextExam.startTime, nextExam.endTime)}
        </span>
      </div>

      <Link href="/exam-dates" prefetch={true} className="mt-1">
        <Button variant="outline" size="sm" className="w-full rounded-full text-xs">
          View Calendar
          <HugeiconsIcon icon={ArrowRight01Icon} className="ml-1 size-3" />
        </Button>
      </Link>
    </Card>
  );
}
