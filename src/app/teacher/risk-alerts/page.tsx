"use client";

import { TeacherRiskAlerts } from "@/components/teacher/risk-alerts";
import { useMemo } from "react";
import { useQuery, QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";

interface StudentRisk {
  studentId: string;
  studentName: string;
  studentEmail: string;
  riskScore: number;
  factors: Array<{
    type: string;
    severity: "high" | "medium" | "low";
    description: string;
    value?: number;
    threshold?: number;
  }>;
  lastActive: number;
  recommendation: string;
}

export default function TeacherRiskAlertsPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Risk Alerts</h1>
            <p className="text-muted-foreground mt-1">
              Monitor student risk levels and intervene early
            </p>
          </div>
        </div>

        <RiskAlertsContent />
      </div>
    </QueryClientProvider>
  );
}

function RiskAlertsContent() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["teacher-risk-alerts"],
    queryFn: async () => {
      const res = await fetch("/api/teacher/risk-alerts");
      if (!res.ok) throw new Error("Failed to fetch risk alerts");
      return res.json();
    },
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-8 bg-muted rounded w-3/4" />
            <div className="h-24 bg-muted rounded mt-4" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load risk alerts</p>
        <button onClick={() => window.location.reload()} className="mt-4 text-primary underline">
          Retry
        </button>
      </div>
    );
  }

  // Transform API data to component format
  const students = (data?.students || []).map((s: any) => ({
    studentId: s.studentId,
    studentName: s.studentName,
    studentEmail: s.studentEmail,
    riskScore: s.riskScore,
    factors: s.factors,
    lastActive: s.lastActive,
    recommendation: s.recommendation,
  }));

  return <TeacherRiskAlerts students={students} />;
}
