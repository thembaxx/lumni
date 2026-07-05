"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface AssignmentSummary {
  id: string;
  topicIds: string;
  status: string;
  createdAt: string;
  dueDate?: string;
}

interface GradeRow {
  studentId: string;
  studentName: string;
  score: number;
  maxScore: number;
  percentage: number;
  completedAt: string;
}

interface GradesResponse {
  assignment: {
    id: string;
    topicIds: string;
    status: string;
    dueDate?: string;
  };
  grades: GradeRow[];
  stats: {
    averagePercentage: number;
    highestPercentage: number;
    lowestPercentage: number;
    submissionCount: number;
    totalStudents: number;
  };
}

interface AssignmentsResponse {
  assignments: AssignmentSummary[];
}

export function GradebookView() {
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);

  const { data: assignmentsData } = useQuery({
    queryKey: ["teacher-assignments"],
    queryFn: async () => {
      const res = await fetch("/api/teacher/assignments");
      if (!res.ok) throw new Error("Failed to fetch assignments");
      return res.json() as Promise<AssignmentsResponse>;
    },
  });

  const { data: gradesData, isLoading: gradesLoading } = useQuery({
    queryKey: ["assignment-grades", selectedAssignmentId],
    queryFn: async () => {
      if (!selectedAssignmentId) return null;
      const res = await fetch(`/api/teacher/assignments/${selectedAssignmentId}/grades`);
      if (!res.ok) throw new Error("Failed to fetch grades");
      return res.json() as Promise<GradesResponse>;
    },
    enabled: !!selectedAssignmentId,
  });

  const assignments = assignmentsData?.assignments ?? [];

  if (assignments.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground text-sm">
        No assignments yet. Create an assignment to see grades.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {assignments.map((a) => {
          const topics = safeParseTopics(a.topicIds);
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => setSelectedAssignmentId(a.id)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                selectedAssignmentId === a.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-muted-foreground/30",
              )}
            >
              {topics.length > 0 ? topics[0] : "Untitled"}
              {topics.length > 1 && ` +${topics.length - 1}`}
            </button>
          );
        })}
      </div>

      {gradesLoading && (
        <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground text-sm">
          Loading grades...
        </div>
      )}

      {gradesData && !gradesLoading && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Average" value={`${gradesData.stats.averagePercentage}%`} />
            <StatCard label="Highest" value={`${gradesData.stats.highestPercentage}%`} />
            <StatCard label="Lowest" value={`${gradesData.stats.lowestPercentage}%`} />
            <StatCard label="Submissions" value={String(gradesData.stats.submissionCount)} />
          </div>

          <div className="rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead>Completed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gradesData.grades.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground text-sm">
                      No submissions yet for this assignment.
                    </TableCell>
                  </TableRow>
                )}
                {gradesData.grades.map((g) => (
                  <TableRow key={g.studentId}>
                    <TableCell className="font-medium">{g.studentName}</TableCell>
                    <TableCell>
                      {g.score} / {g.maxScore}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "font-medium",
                          g.percentage >= 80 ? "text-green-600" : g.percentage >= 60 ? "text-amber-600" : "text-red-600",
                        )}
                      >
                        {g.percentage}%
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {g.completedAt ? new Date(g.completedAt).toLocaleDateString() : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {!selectedAssignmentId && !gradesLoading && (
        <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground text-sm">
          Select an assignment above to view grades.
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-muted-foreground text-xs uppercase tracking-wide">{label}</p>
      <p className="font-semibold text-lg">{value}</p>
    </div>
  );
}

function safeParseTopics(json: string): string[] {
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}
