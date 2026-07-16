import { useMutation, useQuery } from "@tanstack/react-query";
import type {
  AdaptivePlanRequest,
  AdaptivePlanResponse,
  StudySession,
} from "@/lib/study-planner/adaptive-planner";

export function useAdaptivePlan(params: AdaptivePlanRequest, enabled = true) {
  return useQuery<AdaptivePlanResponse>({
    queryKey: ["adaptive-plan", params],
    queryFn: async () => {
      const res = await fetch("/api/engine/adaptive-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error("Failed to generate adaptive plan");
      return res.json();
    },
    enabled,
    staleTime: 1000 * 60 * 30,
  });
}

export function useGenerateAdaptivePlan() {
  return useMutation<AdaptivePlanResponse, Error, AdaptivePlanRequest>({
    mutationFn: async (params) => {
      const res = await fetch("/api/engine/adaptive-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error || "Failed to generate adaptive plan");
      }
      return res.json();
    },
  });
}

export function useAdaptivePlanSessions(plan?: AdaptivePlanResponse): StudySession[] {
  if (!plan) return [];
  return plan.sessions.toSorted((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
}

export function useAdaptivePlanByDate(plan?: AdaptivePlanResponse): Record<string, StudySession[]> {
  if (!plan) return {};
  return plan.sessions.reduce(
    (acc, session) => {
      const date = session.scheduledDate;
      if (!acc[date]) acc[date] = [];
      acc[date].push(session);
      return acc;
    },
    {} as Record<string, StudySession[]>,
  );
}
