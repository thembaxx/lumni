"use client";

import { useQuery } from "@tanstack/react-query";
import type { Question } from "@/lib/question-engine/types";
import { budgetFetch } from "@/lib/shared/api-fetch";
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

export function useVisualEngine(question: Question | null) {
  return useQuery({
    queryKey: ["visualEngine", question?.id],
    queryFn: () => {
      if (!question) throw new Error("No question provided");
      return fetchVisual(question);
    },
    enabled: !!question,
    staleTime: 1000 * 60 * 60,
    retry: 1,
    select: (data) => data.visual,
  });
}
