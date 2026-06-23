"use client";

import { Suspense, use } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface GhostStats {
  totalStudents: number;
  subjectEnrollments: Record<string, number>;
  avgScores: Record<string, number>;
  totalQuizAttempts: number;
  completionRate: number;
}

function GhostContent({ token }: { token: string }) {
  const {
    data: stats,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["ghost", token],
    queryFn: async () => {
      const res = await fetch(`/api/ghost/${token}`);
      if (!res.ok) throw new Error("not found");
      return res.json() as Promise<GhostStats>;
    },
    enabled: !!token,
  });

  if (isLoading)
    return (
      <div className="p-8">
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  if (isError)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Invalid or expired link</p>
      </div>
    );
  if (!stats) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8">
      <h1 className="font-bold font-heading text-2xl">School Dashboard</h1>
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Students</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-bold text-3xl">{stats.totalStudents}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Quiz Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-bold text-3xl">{stats.completionRate}%</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Subject Enrollment</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.entries(stats.subjectEnrollments).map(([sub, count]) => (
            <div key={sub} className="flex items-center justify-between py-1">
              <span className="text-sm">{sub}</span>
              <span className="font-medium text-sm">{count} students</span>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Average Scores</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.entries(stats.avgScores).map(([sub, score]) => (
            <div key={sub} className="flex items-center justify-between py-1">
              <span className="text-sm">{sub}</span>
              <span className="font-medium text-sm">{score}%</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function GhostPageInner({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  return <GhostContent token={token} />;
}

export default function GhostDashboardPage({ params }: { params: Promise<{ token: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="p-8">
          <Skeleton className="h-64 rounded-xl" />
        </div>
      }
    >
      <GhostPageInner params={params} />
    </Suspense>
  );
}
