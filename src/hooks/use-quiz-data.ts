"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { dexieDataAccess } from "@/lib/db";
import {
  loadRetentionQuestions,
  markRetentionCompleted,
  type RetentionQuestion,
} from "@/components/quiz/hooks/quiz-utils";

export function useRetentionQuestions() {
  const queryClient = useQueryClient();

  const loadRetention = useCallback(
    async (subject: string): Promise<RetentionQuestion[]> => {
      const data = await queryClient.fetchQuery({
        queryKey: ["retention-questions", subject],
        queryFn: () => loadRetentionQuestions(dexieDataAccess, subject, Date.now()),
      });
      return data ?? [];
    },
    [queryClient],
  );

  const markCompleted = useCallback(async (ids: string[]) => {
    await markRetentionCompleted(dexieDataAccess, ids);
  }, []);

  return { loadRetention, markCompleted };
}
