"use client";

import BookOpen01Icon from "@hugeicons/core-free-icons/BookOpen01Icon";
import GraduationCapIcon from "@hugeicons/core-free-icons/GraduationCapIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRecentLessonProgress } from "@/hooks/use-lesson-progress";
import { useNavigationDirection } from "@/hooks/use-navigation-direction";
import { useAuth } from "@/lib/auth/auth-context";

interface LessonProgressRow {
  userId: string;
  lessonId: string;
  completedSections: number;
  totalSections: number;
  completedAt: number;
  score?: number;
}

function parseLessonId(lessonId: string) {
  const parts = lessonId.split(":");
  return {
    subjectId: parts[0] ?? "",
    topicId: parts[1] ?? "",
    subtopicId: parts[2] ?? "",
  };
}

export function LessonLibraryCard() {
  const { user } = useAuth();
  const { push } = useNavigationDirection();
  const userId = user?.$id ?? "anonymous";

  const { data: recentLessons } = useRecentLessonProgress(userId);

  const hasProgress = recentLessons && recentLessons.length > 0;

  return (
    <Card className="overflow-hidden rounded-card shadow-level-1">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-bold text-lg">Continue Learning</CardTitle>
          <HugeiconsIcon icon={GraduationCapIcon} className="size-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 p-5 pt-0">
        {hasProgress ? (
          recentLessons.map((lesson: LessonProgressRow) => {
            const { subjectId, topicId, subtopicId } = parseLessonId(lesson.lessonId);
            const pct =
              lesson.totalSections > 0
                ? Math.round((lesson.completedSections / lesson.totalSections) * 100)
                : 0;
            const label = subtopicId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

            return (
              <div
                key={lesson.lessonId}
                className="flex items-center gap-3 rounded-card border border-border/60 bg-card p-3 shadow-level-1 transition-shadow duration-300 hover:shadow-level-2 press-scale"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-card bg-(--system-accent)/10">
                  <HugeiconsIcon icon={BookOpen01Icon} className="size-4 text-(--system-accent)" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="truncate font-semibold text-sm">{label}</p>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full origin-left rounded-full bg-(--system-accent) transition-[transform]"
                        style={{ transform: `scaleX(${pct / 100})` }}
                      />
                    </div>
                    <span className="text-(--fs-caption-3) text-muted-foreground tabular-nums">
                      {pct}%
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 rounded-full text-xs press-scale"
                  onClick={() => push(`/study/${subjectId}/${topicId}/${subtopicId}`)}
                >
                  Resume
                </Button>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <HugeiconsIcon icon={BookOpen01Icon} className="size-10 text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">
              Start a lesson to track your progress here.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full press-scale"
              onClick={() => push("/study")}
            >
              Browse Lessons
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
