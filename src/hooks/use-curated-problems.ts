"use client";

import { createInvalidatingMutation } from "@/hooks/use-hook-factories";
import { logError } from "@/lib/shared/logger";

export interface CuratedProblem {
  id: string;
  questionText: string;
  solution: string;
  steps: string[];
  difficulty: string;
  topic: string;
}

interface CuratedProblemsResponse {
  problems: CuratedProblem[];
  subject: string;
  topic: string;
  count: number;
}

interface UseCuratedProblemsParams {
  subject: string;
  topic?: string;
  count?: number;
}

export const useCuratedProblems = createInvalidatingMutation<
  UseCuratedProblemsParams,
  CuratedProblemsResponse,
  CuratedProblemsResponse
>({
  invalidateKey: ["curated-problems"],
  mutationFn: async ({ subject, topic, count = 5 }) => {
    const res = await fetch("/api/curated-problems", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, topic, count }),
    });
    if (!res.ok) {
      const err = await res.json().catch((e) => {
        logError("useCuratedProblems.json", e);
        return {};
      });
      throw new Error(err.error || "Failed to generate problems");
    }
    return res.json();
  },
});
