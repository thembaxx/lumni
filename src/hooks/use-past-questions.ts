import { useQuery } from "@tanstack/react-query";
import type { PastPaperQuestion } from "@/lib/exam-paper-ingestion/past-paper-question-types";

interface UsePastQuestionsOptions {
  subject?: string;
  topic?: string;
  subtopicId?: string;
  type?: string;
  year?: number;
  sort?: string;
  limit?: number;
  enabled?: boolean;
}

interface PastQuestionsResponse {
  questions: PastPaperQuestion[];
}

export function usePastQuestions({
  subject,
  topic,
  subtopicId,
  type,
  year,
  sort = "-year",
  limit = 20,
  enabled = true,
}: UsePastQuestionsOptions) {
  const params = new URLSearchParams();
  if (subject) params.set("subject", subject);
  if (topic) params.set("topic", topic);
  if (subtopicId) params.set("subtopicId", subtopicId);
  if (type) params.set("type", type);
  if (year) params.set("year", String(year));
  if (sort) params.set("sort", sort);
  if (limit) params.set("limit", String(limit));

  return useQuery<PastQuestionsResponse>({
    queryKey: ["past-questions", subject, topic, subtopicId, type, year, sort, limit],
    queryFn: async () => {
      const res = await fetch(`/api/exam-papers/questions?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch past questions");
      return res.json();
    },
    enabled: enabled && !!subject,
    staleTime: 30_000,
  });
}
