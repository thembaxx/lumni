"use client";

import BookOpen02Icon from "@hugeicons/core-free-icons/BookOpen02Icon";
import Chat01Icon from "@hugeicons/core-free-icons/Chat01Icon";
import PlayIcon from "@hugeicons/core-free-icons/PlayIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { StudentAssignment } from "@/app/api/student/assignments/route";
import { AssignmentThread } from "@/components/teacher/assignment-thread";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function MyAssignments() {
  const router = useRouter();
  const [questionOpen, setQuestionOpen] = useState<string | null>(null);
  const { data, isLoading, isError, error } = useQuery<{
    assignments: StudentAssignment[];
  }>({
    queryKey: ["studentAssignments"],
    queryFn: () =>
      fetch("/api/student/assignments").then((r) => {
        if (r.status === 401) return { assignments: [] };
        if (!r.ok) throw new Error("Failed to fetch");
        return r.json();
      }),
    staleTime: 1000 * 60 * 5,
  });

  const assignments = data?.assignments ?? [];

  if (isError) {
    return (
      <Card className="overflow-hidden rounded-card shadow-level-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-bold text-base tracking-tight">
            <HugeiconsIcon icon={BookOpen02Icon} className="size-5" />
            My Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-6 text-center text-destructive text-xs">
            Failed to load assignments: {error?.message}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="overflow-hidden rounded-card shadow-level-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-bold text-base tracking-tight">
            <HugeiconsIcon icon={BookOpen02Icon} className="size-5" />
            My Assignments
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  if (assignments.length === 0) {
    return (
      <Card className="overflow-hidden rounded-card shadow-level-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-bold text-base tracking-tight">
            <HugeiconsIcon icon={BookOpen02Icon} className="size-5" />
            My Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-6 text-center text-muted-foreground text-xs">No assignments yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden rounded-card shadow-level-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-bold text-base tracking-tight">
          <HugeiconsIcon icon={BookOpen02Icon} className="size-5" />
          My Assignments
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {assignments.map((a) => (
          <div key={a.id}>
            <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-card p-3 shadow-level-1 transition-all duration-300 hover:shadow-level-2 press-scale">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-(--system-accent)/10">
                <HugeiconsIcon icon={BookOpen02Icon} className="size-4 text-(--system-accent)" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <p className="font-medium text-sm">{a.topics.join(", ") || "General"}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-muted-foreground text-xs">
                  <span>Assigned {new Date(a.createdAt).toLocaleDateString()}</span>
                  {a.dueDate && (
                    <span className={isOverdue(a.dueDate) ? "text-destructive" : ""}>
                      Due {new Date(a.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {a.submission && (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-xs">
                        Score:{" "}
                        <span className="tabular-nums">
                          {a.submission.score}/{a.submission.maxScore}
                        </span>
                      </span>
                      <Badge variant="secondary" className="text-(--fs-caption-3)">
                        <span className="tabular-nums">
                          {a.submission.correctCount}/{a.submission.totalQuestions}
                        </span>{" "}
                        correct
                      </Badge>
                    </div>
                    {a.submission.teacherComment && (
                      <p className="text-(--fs-caption-3) text-muted-foreground italic">
                        Teacher: &ldquo;{a.submission.teacherComment}&rdquo;
                      </p>
                    )}
                  </div>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 gap-1.5 text-xs press-scale"
                  onClick={() => setQuestionOpen(questionOpen === a.id ? null : a.id)}
                >
                  <HugeiconsIcon icon={Chat01Icon} className="size-3.5" />
                  {questionOpen === a.id ? "Close" : "Ask Question"}
                </Button>
                {a.submission ? (
                  <Badge variant="outline" className="text-(--fs-caption-3)">
                    Done
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="default"
                    className="h-8 gap-1.5 text-xs press-scale"
                    onClick={() =>
                      router.push(
                        `/quiz?subject=${a.topics[0]?.toLowerCase() ?? ""}&count=10&assignmentId=${a.id}`,
                      )
                    }
                  >
                    <HugeiconsIcon icon={PlayIcon} className="size-3.5" />
                    Practice
                  </Button>
                )}
              </div>
            </div>
            {questionOpen === a.id && (
              <div className="mt-2 rounded-xl border bg-card p-3">
                <AssignmentThread assignmentId={a.id} />
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function isOverdue(dueDate: string): boolean {
  return new Date(dueDate) < new Date();
}
