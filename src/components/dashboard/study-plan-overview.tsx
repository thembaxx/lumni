"use client";

import Bookmark02Icon from "@hugeicons/core-free-icons/Bookmark02Icon";
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon";
import CheckListIcon from "@hugeicons/core-free-icons/CheckListIcon";
import RefreshIcon from "@hugeicons/core-free-icons/RefreshIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStudyPlanner } from "@/hooks/use-study-planner";
import { Link } from "@/i18n/navigation";
import { logError } from "@/lib/shared/logger";
import { getSubjectAbbr } from "@/lib/subjects";
import { getWeekOldThreshold, loadStudyPlan } from "@/lib/utils/study-planner";
import { useBookmarksStore } from "@/store/bookmarks";
import { GeneratePlanForm } from "./generate-plan-form";
import { StudyPlanEmpty } from "./study-plan-empty";
import { StudySessionList } from "./study-session-list";

export function StudyPlanOverview() {
  const { todaySessions, upcomingExams, stats, generatePlan, isGenerating, stale } =
    useStudyPlanner();
  const [showForm, setShowForm] = useState(false);
  const [dismissedStale, setDismissedStale] = useState(false);
  const autoRefreshDoneRef = useRef(false);
  const router = useRouter();
  const bookmarks = useBookmarksStore((s) => s.bookmarks);

  const handleStartSession = useCallback(
    (session: { subject: string; topic?: string; duration: number }) => {
      const params = new URLSearchParams();
      params.set("subject", session.subject);
      if (session.topic) params.set("topic", session.topic);
      if (session.duration) params.set("maxTime", String(session.duration * 60));
      params.set("count", "10");
      params.set("autoStart", "true");
      router.push(`/quiz?${params.toString()}`);
    },
    [router],
  );
  const bookmarksBySubject = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of bookmarks) {
      map.set(b.subject, (map.get(b.subject) ?? 0) + 1);
    }
    return map;
  }, [bookmarks]);

  // Weekly auto-refresh on mount
  useEffect(() => {
    if (autoRefreshDoneRef.current) return;
    autoRefreshDoneRef.current = true;
    const plan = loadStudyPlan();
    if (plan.generatedAt > 0 && plan.lastCompetencyRefresh < getWeekOldThreshold()) {
      generatePlan({
        targetAps: Number.parseInt(localStorage.getItem("lumni_plan_target_aps") ?? "25", 10),
        dailyStudyMinutes: Number.parseInt(
          localStorage.getItem("lumni_plan_daily_minutes") ?? "30",
          10,
        ),
      }).catch((err) => logError("study-plan-overview.generate", err));
    }
  }, [generatePlan]);

  if (todaySessions.length === 0 && upcomingExams.length === 0 && !showForm) {
    return <StudyPlanEmpty onGenerate={() => setShowForm(true)} />;
  }

  if (showForm) {
    return (
      <GeneratePlanForm
        isGenerating={isGenerating}
        onGenerate={async (options) => {
          await generatePlan(options);
          setShowForm(false);
        }}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 font-bold text-base tracking-tight">
          <HugeiconsIcon icon={CheckListIcon} className="size-5" />
          Today's Plan
        </CardTitle>
        <Link
          href="/study-plan"
          prefetch={true}
          className="font-medium text-(--system-accent) text-xs hover:underline"
        >
          View all
        </Link>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {stale && !dismissedStale && !showForm && (
          <div className="flex items-center justify-between gap-2 rounded-xl bg-warning/10 px-3 py-2 text-foreground dark:bg-warning/15">
            <div className="flex items-center gap-2 text-xs">
              <HugeiconsIcon icon={RefreshIcon} className="size-3.5 shrink-0 text-warning" />
              <span>
                Your scores changed, so your plan adapts to your performance. Regenerate to
                optimise.
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="relative h-6 px-2 text-xs after:absolute after:-inset-2"
                onClick={() => setShowForm(true)}
              >
                Regenerate
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDismissedStale(true)}
                aria-label="Dismiss"
                className="relative size-6 after:absolute after:-inset-2"
              >
                <HugeiconsIcon icon={Cancel01Icon} className="size-3" />
              </Button>
            </div>
          </div>
        )}
        <StudySessionList
          sessions={todaySessions}
          onStartSession={handleStartSession}
          completedSessions={stats.completedSessions}
          studyTimeMinutes={stats.studyTimeMinutes}
          progress={stats.progress}
        />
        {bookmarksBySubject.size > 0 && (
          <div className="flex flex-col gap-1.5">
            <p className="flex items-center gap-1 font-medium text-muted-foreground text-xs">
              <HugeiconsIcon icon={Bookmark02Icon} className="size-3" />
              Bookmarked questions
            </p>
            <div className="flex flex-wrap gap-1.5">
              {bookmarksBySubject
                .entries()
                .toArray()
                .toSorted((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([subj, count]) => (
                  <Link
                    key={subj}
                    href={`/quiz?subject=${subj}&count=10`}
                    className="inline-flex items-center gap-1 rounded-full bg-muted/50 px-2 py-0.5 font-medium text-muted-foreground text-xs hover:bg-muted hover:text-foreground"
                  >
                    {getSubjectAbbr(subj)}
                    <span className="tabular-nums">{count}</span>
                  </Link>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
