"use client";

import { createInvalidatingMutation } from "@/hooks/use-hook-factories";
import { budgetFetch } from "@/lib/shared/api-fetch";
import type { StudyGuide } from "@/lib/study-guide/types";

interface UseStudyGuideParams {
  subject: string;
  topic: string;
}

export const useStudyGuide = createInvalidatingMutation<
  UseStudyGuideParams,
  StudyGuide,
  StudyGuide
>({
  invalidateKey: ["study-guide"],
  mutationFn: ({ subject, topic }) =>
    budgetFetch<StudyGuide>(
      "/api/engine/study-guide",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, topic }),
      },
      "GenerateStudyGuide",
    ),
});
