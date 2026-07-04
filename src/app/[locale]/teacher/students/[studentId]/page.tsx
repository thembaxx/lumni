"use client";

export const instant = false;

import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { AmbientGradient } from "@/components/shared/ambient-gradient";
import { NoiseOverlay } from "@/components/shared/noise-overlay";
import { MasteryBadge } from "@/components/atoms/mastery-badge";
import { ObservationTimeline } from "@/components/teacher/observation-timeline";
import { Badge } from "@/components/ui/badge";
import { PageContainer } from "@/components/layout/page-container";
import { Progress } from "@/components/ui/progress";

interface StudentData {
  id: string;
  name: string;
  initials: string;
  grade: string;
  overallScore: number;
  weakTopics: string[];
  lastActive: string;
}

export default function StudentDetailPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const { back } = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["teacher-student", studentId],
    queryFn: async () => {
      const res = await fetch("/api/teacher/students");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = (await res.json()) as { students: StudentData[] };
      return json.students.find((s) => s.id === studentId) ?? null;
    },
  });

  if (isLoading) {
    return (
      <div className="relative min-h-dvh bg-system-grouped pt-4">
        <AmbientGradient variant="dashboard" />
        <NoiseOverlay opacity={0.015} />
        <PageContainer className="flex items-start justify-center pt-10">
          <p className="text-muted-foreground">Loading...</p>
        </PageContainer>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="relative min-h-dvh bg-system-grouped pt-4">
        <AmbientGradient variant="dashboard" />
        <NoiseOverlay opacity={0.015} />
        <PageContainer className="flex items-start justify-center pt-10">
          <div className="flex flex-col items-center gap-3 py-20">
            <p className="font-semibold text-lg text-muted-foreground">Student not found</p>
            <p className="text-muted-foreground/60 text-sm">
              This student is not linked to your account.
            </p>
          </div>
        </PageContainer>
      </div>
    );
  }

  const student = data;

  return (
    <div className="relative min-h-dvh bg-system-grouped pt-4 pb-24">
      <AmbientGradient variant="dashboard" />
      <NoiseOverlay opacity={0.015} />
      <PageContainer className="flex items-start justify-center pt-10">
        <div className="w-full max-w-md">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="font-semibold text-xl">{student.name}</h1>
              <p className="text-muted-foreground text-sm">
                Grade {student.grade} &middot; Last active {student.lastActive}
              </p>
            </div>
            <button
              onClick={() => back()}
              className="rounded-xl bg-white/5 p-2 transition-[scale,background-color] duration-150 hover:scale-105 hover:bg-white/10 press-scale dark:bg-white/10 dark:hover:bg-white/15"
            >
              <HugeiconsIcon icon={Cancel01Icon} data-icon className="size-4" />
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-lg border bg-card p-4">
              <p className="mb-2 font-medium text-sm">Overall Performance</p>
              <div className="flex items-center gap-3">
                <MasteryBadge
                  level={
                    student.overallScore >= 80
                      ? "mastered"
                      : student.overallScore >= 60
                        ? "proficient"
                        : student.overallScore >= 40
                          ? "developing"
                          : "novice"
                  }
                />
                <Progress value={student.overallScore} className="h-2 flex-1" />
                <span className="font-semibold text-sm">{student.overallScore}%</span>
              </div>
            </div>

            {student.weakTopics.length > 0 && (
              <div className="rounded-lg border bg-card p-4">
                <p className="mb-2 font-medium text-sm">Areas to Improve</p>
                <div className="flex flex-wrap gap-1.5">
                  {student.weakTopics.map((topic) => (
                    <Badge
                      key={topic}
                      variant="secondary"
                      className="bg-destructive/10 text-destructive"
                    >
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-lg border bg-card p-4">
              <p className="mb-2 font-medium text-sm">Observations</p>
              <ObservationTimeline studentId={student.id} />
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
