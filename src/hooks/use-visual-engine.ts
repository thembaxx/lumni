"use client";

import { createApiQuery } from "@/hooks/use-hook-factories";
import { budgetFetch } from "@/lib/shared/api-fetch";
import type { Question } from "@/lib/question-engine/types";
import type { VisualContent } from "@/lib/visual-engine/types";

interface VisualResult {
  visual: VisualContent | null;
}

function fetchVisual(question: Question): Promise<VisualResult> {
  return budgetFetch<VisualResult>(
    "/api/engine/visual",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questionId: question.id,
        questionText: question.questionText,
        subject: question.subject,
        topic: question.topic,
      }),
    },
    "FetchVisual",
  );
}

const useVisualEngineQuery = createApiQuery<VisualResult, Question | null, VisualContent | null>({
  queryKey: (q) => ["visualEngine", q?.id],
  fetchFn: async (q) => {
    if (!q) return { visual: null };
    return fetchVisual(q);
  },
  enabled: (q) => !!q,
  staleTime: 1000 * 60 * 60,
  retry: 1,
  select: (data) => data.visual,
});

export function useVisualEngine(question: Question | null) {
  return useVisualEngineQuery(question);
}
