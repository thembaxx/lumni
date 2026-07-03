"use client";

import BookOpen01Icon from "@hugeicons/core-free-icons/BookOpen01Icon";
import Calendar01Icon from "@hugeicons/core-free-icons/Calendar01Icon";
import Clock01Icon from "@hugeicons/core-free-icons/Clock01Icon";
import NoteEditIcon from "@hugeicons/core-free-icons/NoteEditIcon";
import Quiz02Icon from "@hugeicons/core-free-icons/Quiz02Icon";
import TimeScheduleIcon from "@hugeicons/core-free-icons/TimeScheduleIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useEffect, useState } from "react";
import { AmbientGradient } from "@/components/shared/ambient-gradient";
import { NoiseOverlay } from "@/components/shared/noise-overlay";
import { PageContainer } from "@/components/layout/page-container";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import {
  formatDuration,
  formatFriendlyDate,
  formatTimeRange,
  getCurrentSession,
  getSessionLabel,
  getSubjectAbbr,
  getSubjectColor,
} from "@/lib/exam-dates";
import type { ExamSlot } from "@/lib/exam-dates/types";
import { cn } from "@/lib/utils";
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon";

function Countdown({ targetDate }: { targetDate: string }) {
  const [text, setText] = useState("");

  useEffect(() => {
    function update() {
      const target = new Date(`${targetDate}T00:00:00`);
      const now = new Date();
      const diff = target.getTime() - now.getTime();

      let newText: string;

      if (diff < 0) {
        const daysPast = Math.floor(Math.abs(diff) / 86400000);
        newText = `Passed ${daysPast} day${daysPast === 1 ? "" : "s"} ago`;
      } else {
        const days = Math.floor(diff / 86400000);
        const hours = Math.floor((diff % 86400000) / 3600000);
        if (days > 0) {
          newText = `${days}d ${hours}h until this exam`;
        } else if (hours > 0) {
          newText = `${hours}h until this exam`;
        } else {
          newText = "Today!";
        }
      }

      setText(newText);
    }

    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return <span className="text-muted-foreground text-xs tabular-nums">{text}</span>;
}

export default function ExamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { push, back } = useRouter();
  const [exam, setExam] = useState<ExamSlot | null>(null);
  const [loading, setLoading] = useState(true);

  const session = getCurrentSession();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { getExamDates } = await import("@/lib/exam-dates/service");
      const slots = await getExamDates(session.session, session.year);
      if (!cancelled) {
        const found = slots.find((s) => s.id === id) ?? null;
        setExam(found);
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id, session]);

  const handlePractice = useCallback(() => {
    if (!exam) return;
    push(`/quiz?subject=${exam.subjectId}&count=10`);
  }, [exam, push]);

  const handleMockExam = useCallback(() => {
    if (!exam) return;
    const examDuration = exam.durationHours * 3600;
    push(`/quiz?subject=${exam.subjectId}&count=30&time=${examDuration}&mode=mock`);
  }, [exam, push]);

  const handleCommonQuestions = useCallback(() => {
    if (!exam) return;
    push(`/quiz?subject=${exam.subjectId}&count=10`);
  }, [exam, push]);

  if (loading) {
    return (
      <div className="relative min-h-dvh bg-system-grouped pt-4">
        <AmbientGradient variant="dashboard" />
        <NoiseOverlay opacity={0.015} />
        <PageContainer>
          <div className="flex items-center justify-center py-20">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </PageContainer>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="relative min-h-dvh bg-system-grouped pt-4">
        <AmbientGradient variant="dashboard" />
        <NoiseOverlay opacity={0.015} />
        <PageContainer>
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <p className="font-semibold text-lg text-muted-foreground">Exam not found</p>
            <p className="text-muted-foreground/60 text-sm">
              No exam with ID &ldquo;{id}&rdquo; exists.
            </p>
          </div>
        </PageContainer>
      </div>
    );
  }

  const isPast = new Date(`${exam.date}T23:59:59`) < new Date();

  return (
    <div className="relative min-h-dvh bg-system-grouped pt-4 pb-24">
      <AmbientGradient variant="dashboard" />
      <NoiseOverlay opacity={0.015} />
      <PageContainer className="flex items-start justify-center pt-10">
        <div className="relative w-full max-w-md">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "ios-caption-3 flex size-6 items-center justify-center rounded-md font-bold text-white",
                  getSubjectColor(exam.subjectId),
                )}
              >
                {getSubjectAbbr(exam.subjectId)}
              </span>
              <h1 className="font-semibold">{exam.subject}</h1>
            </div>
            <button
              onClick={() => back()}
              className="rounded-xl bg-white/5 p-2 transition-[scale,background-color] duration-150 hover:scale-105 hover:bg-white/10 press-scale dark:bg-white/10 dark:hover:bg-white/15"
            >
              <HugeiconsIcon icon={Cancel01Icon} data-icon className="size-4" />
            </button>
          </div>

          <p className="mb-4 text-muted-foreground text-sm">
            Paper {exam.paperNumber} &middot; {getSessionLabel(exam.session, exam.year)}
          </p>

          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
              <HugeiconsIcon
                icon={Calendar01Icon}
                className="size-4 shrink-0 text-(--system-accent)"
              />
              <div className="min-w-0">
                <p className="ios-caption-3 text-muted-foreground">Date</p>
                <p className="truncate font-medium text-xs">{formatFriendlyDate(exam.date)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
              <HugeiconsIcon
                icon={Clock01Icon}
                className="size-4 shrink-0 text-(--system-accent)"
              />
              <div className="min-w-0">
                <p className="ios-caption-3 text-muted-foreground">Time</p>
                <p className="truncate font-medium text-xs">
                  {formatTimeRange(exam.startTime, exam.endTime)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
              <HugeiconsIcon
                icon={TimeScheduleIcon}
                className="size-4 shrink-0 text-(--system-accent)"
              />
              <div className="min-w-0">
                <p className="ios-caption-3 text-muted-foreground">Duration</p>
                <p className="truncate font-medium text-xs">{formatDuration(exam.durationHours)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
              <HugeiconsIcon
                icon={NoteEditIcon}
                className="size-4 shrink-0 text-(--system-accent)"
              />
              <div className="min-w-0">
                <p className="ios-caption-3 text-muted-foreground">Paper</p>
                <p className="truncate font-medium text-xs">Paper {exam.paperNumber}</p>
              </div>
            </div>
          </div>

          {!isPast && (
            <div className="mb-4 flex items-center justify-center gap-1.5 rounded-lg bg-muted/30 py-2">
              <HugeiconsIcon icon={TimeScheduleIcon} className="size-3.5 text-(--system-accent)" />
              <Countdown targetDate={exam.date} />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handlePractice}
              className="flex cursor-pointer items-center justify-between rounded-xl bg-(--system-accent) px-4 py-3 text-left text-white transition-[scale,background-color,box-shadow] hover:brightness-110 press-scale"
            >
              <div className="flex items-center gap-2.5">
                <HugeiconsIcon icon={Quiz02Icon} className="size-4" />
                <div>
                  <p className="font-medium text-xs">Practice</p>
                  <p className="ios-caption-3 text-white/70">
                    AI-generated questions on this subject
                  </p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={handleMockExam}
              className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-left transition-[scale,background-color,box-shadow] hover:bg-muted/50 press-scale"
            >
              <div className="flex items-center gap-2.5">
                <HugeiconsIcon icon={BookOpen01Icon} className="size-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-xs">Mock Exam</p>
                  <p className="ios-caption-3 text-muted-foreground">
                    Timed practice with exam-format questions
                  </p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={handleCommonQuestions}
              className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-left transition-[scale,background-color,box-shadow] hover:bg-muted/50 press-scale"
            >
              <div className="flex items-center gap-2.5">
                <HugeiconsIcon icon={NoteEditIcon} className="size-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-xs">Common Questions</p>
                  <p className="ios-caption-3 text-muted-foreground">
                    Frequently tested questions in this subject
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}

export const instant = false;
