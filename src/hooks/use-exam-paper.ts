"use client";

import type { ExamPaper } from "@/types/exam-paper";
import { createApiQuery } from "./use-hook-factories";

interface ExamPaperResponse {
  metadata: {
    id: string;
    subject: string;
    paperCode: string;
    examPeriod: string;
    year: number;
    grade: number;
    language: string;
    totalMarks: number;
    duration: string;
  };
  exam: ExamPaper;
}

async function fetchExamPaper(id: string): Promise<ExamPaperResponse> {
  const res = await fetch(`/api/exam-papers/${id}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to fetch exam paper");
  }
  return res.json() as Promise<ExamPaperResponse>;
}

export const useExamPaper = createApiQuery<ExamPaperResponse, string>({
  queryKey: (id) => ["exam-paper", id],
  fetchFn: fetchExamPaper,
  staleTime: 1000 * 60 * 30,
  enabled: (id) => !!id,
});
