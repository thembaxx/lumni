"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PastQuestionFilters } from "@/components/practice/past-question-filters";
import { PastQuestionList } from "@/components/practice/past-question-list";
import { apiFetch } from "@/lib/shared/api-fetch";
import type { PastPaperQuestion } from "@/lib/exam-paper-ingestion/past-paper-question-types";

export function PracticeQuestionsClient() {
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState<string | undefined>();
  const [year, setYear] = useState<string | undefined>();

  const { data, isLoading } = useQuery({
    queryKey: ["past-questions", { subject, topic, year }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (subject) params.set("subject", subject);
      if (topic) params.set("topic", topic);
      if (year) params.set("year", year);
      const res = await apiFetch<{ questions: PastPaperQuestion[] }>(
        `/api/exam-papers/questions?${params}`,
        { method: "GET" },
      );
      return res.questions;
    },
    staleTime: 1000 * 60 * 5,
  });

  const handleClear = () => {
    setSubject("");
    setTopic(undefined);
    setYear(undefined);
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Past Paper Questions</h1>
      <PastQuestionFilters
        subject={subject}
        topic={topic}
        year={year}
        onSubjectChange={setSubject}
        onTopicChange={setTopic}
        onYearChange={setYear}
        onClear={handleClear}
      />
      <PastQuestionList
        questions={data ?? []}
        isLoading={isLoading}
        hasMore={false}
        onLoadMore={() => {}}
        hasSubject={!!subject}
      />
    </div>
  );
}
