"use client";

import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon";
import ArrowUp01Icon from "@hugeicons/core-free-icons/ArrowUp01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AssignmentThread } from "@/components/teacher/assignment-thread";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface SubmissionSummary {
  studentId: string;
  score: number;
  maxScore: number;
  totalQuestions: number;
  correctCount: number;
  completedAt: string;
  teacherComment?: string;
}

interface AssignmentData {
  id: string;
  topicIds: string;
  status: string;
  createdAt: string;
  dueDate?: string;
  submissions: SubmissionSummary[];
}

interface TeacherAssignmentsResponse {
  assignments: AssignmentData[];
}

export function AssignmentReviewPanel({ className }: { className?: string }) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, string>>({});

  const { data, isLoading, isError, error } = useQuery<TeacherAssignmentsResponse>({
    queryKey: ["teacherAssignments"],
    queryFn: () =>
      fetch("/api/teacher/assignments").then((r) => {
        if (!r.ok) throw new Error("Failed to fetch");
        return r.json();
      }),
    staleTime: 1000 * 60 * 2,
  });

  const submitComment = useMutation({
    mutationFn: async ({
      assignmentId,
      studentId,
      comment,
    }: {
      assignmentId: string;
      studentId: string;
      comment: string;
    }) => {
      const res = await fetch(`/api/assignments/${assignmentId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, comment }),
      });
      if (!res.ok) throw new Error("Failed to submit comment");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacherAssignments"] });
      toast({ type: "success", message: "Comment added" });
    },
    onError: () => toast({ type: "error", message: "Failed to add comment" }),
  });

  const assignments = data?.assignments ?? [];
  const withSubmissions = assignments.filter((a) => a.submissions.length > 0);

  if (isError) {
    return (
      <Card className={cn(className)}>
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
      <Card className={cn(className)}>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (withSubmissions.length === 0) return null;

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">Assignment Review</CardTitle>
        <CardDescription>Review student submissions and provide feedback</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {withSubmissions.map((a) => {
          const topics = parseTopicIds(a.topicIds);
          const isOpen = expanded === a.id;
          return (
            <div key={a.id} className="rounded-lg border bg-muted/20 p-3">
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : a.id)}
                className="flex w-full items-center justify-between text-left"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm">{topics.join(", ") || "General"}</p>
                  <p className="mt-0.5 text-muted-foreground text-xs">
                    {a.submissions.length} submission
                    {a.submissions.length !== 1 ? "s" : ""}
                    {a.dueDate && <> · Due {new Date(a.dueDate).toLocaleDateString()}</>}
                  </p>
                </div>
                <HugeiconsIcon
                  icon={isOpen ? ArrowUp01Icon : ArrowDown01Icon}
                  className="ml-2 size-4 shrink-0 text-muted-foreground"
                />
              </button>
              {isOpen && (
                <div className="mt-3 flex flex-col gap-2">
                  {a.submissions.map((s) => {
                    const commentKey = `${a.id}_${s.studentId}`;
                    return (
                      <div key={commentKey} className="rounded-lg border bg-card p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="font-medium text-xs">
                              Student: {s.studentId.slice(0, 8)}...
                            </p>
                            <p className="mt-0.5 text-muted-foreground text-xs">
                              Score: {s.score}/{s.maxScore} · {s.correctCount}/{s.totalQuestions}{" "}
                              correct · {new Date(s.completedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        {s.teacherComment && (
                          <p className="mt-2 text-[11px] text-muted-foreground italic">
                            Your comment: &ldquo;{s.teacherComment}&rdquo;
                          </p>
                        )}
                        <div className="mt-2 flex gap-2">
                          <Input
                            value={comments[commentKey] ?? ""}
                            onChange={(e) =>
                              setComments((prev) => ({
                                ...prev,
                                [commentKey]: e.target.value,
                              }))
                            }
                            placeholder="Add feedback..."
                            className="h-8 text-xs"
                          />
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 shrink-0 text-xs"
                            disabled={!comments[commentKey]?.trim() || submitComment.isPending}
                            onClick={() =>
                              submitComment.mutate({
                                assignmentId: a.id,
                                studentId: s.studentId,
                                comment: comments[commentKey] ?? "",
                              })
                            }
                          >
                            Send
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  <div className="rounded-lg border bg-card p-3">
                    <p className="mb-2 font-medium text-xs">Questions</p>
                    <AssignmentThread assignmentId={a.id} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function parseTopicIds(raw: string): string[] {
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}
