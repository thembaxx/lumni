"use client";

import { useCallback } from "react";
import { dexieDataAccess } from "@/lib/db";
import type { QuizAttempt, ExamSessionSnapshot } from "@/lib/db/types";

export function useExportData() {
  const getQuizAttempts = useCallback(async (limit = 100): Promise<QuizAttempt[]> => {
    return dexieDataAccess.quizAttempts.orderBy("completedAt").toReversed().limit(limit).toArray();
  }, []);

  const getExamSessions = useCallback(async (limit = 100): Promise<ExamSessionSnapshot[]> => {
    return dexieDataAccess.examSessions.limit(limit).toArray();
  }, []);

  return { getQuizAttempts, getExamSessions };
}
