import { useQuery } from "@tanstack/react-query";
import type { ExamPaper } from "@/types/exam-paper";

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

export function useExamPaper(id: string | null) {
  return useQuery({
    queryKey: ["exam-paper", id],
    queryFn: async () => {
      if (!id) throw new Error("No exam paper ID");
      const res = await fetch(`/api/exam-papers/${id}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch exam paper");
      }
      return res.json() as Promise<ExamPaperResponse>;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  });
}
