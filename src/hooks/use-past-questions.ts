"use client";

import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { budgetFetch } from "@/lib/shared/api-fetch";
import type { PastPaperQuestion } from "@/lib/exam-paper-ingestion/past-paper-question-types";

const PAGE_SIZE = 20;

interface UsePastQuestionsOptions {
  subject?: string;
  topic?: string;
  subtopicId?: string;
  type?: string;
  year?: number;
  limit?: number;
  enabled?: boolean;
}

interface UsePastQuestionsReturn {
  data: { questions: PastPaperQuestion[] } | undefined;
  questions: PastPaperQuestion[];
  isPending: boolean;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  loadMore: () => void;
  hasMore: boolean;
  currentPage: number;
  subject: string;
  topic: string | undefined;
  year: number | undefined;
  page: number;
  setSubject: (value: string) => void;
  setTopic: (value: string) => void;
  setYear: (value: string) => void;
  clearFilters: () => void;
}

export function usePastQuestions(options?: UsePastQuestionsOptions): UsePastQuestionsReturn {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const urlSubject = searchParams.get("subject") ?? "";
  const urlTopic = searchParams.get("topic") ?? undefined;
  const urlYearParam = searchParams.get("year");
  const urlYear = urlYearParam ? parseInt(urlYearParam, 10) : undefined;
  const pageParam = searchParams.get("page");
  const page = pageParam ? parseInt(pageParam, 10) : 0;

  const resolvedPage = Math.max(0, page);

  // When options are provided, use them as query params (for existing consumers)
  // Otherwise use URL search params
  const querySubject = options?.subject ?? urlSubject;
  const queryTopic = options?.topic ?? urlTopic;
  const queryYear = options?.year ?? urlYear;
  const queryLimit = options?.limit ?? PAGE_SIZE;
  const queryOffset = resolvedPage * PAGE_SIZE;
  const isEnabled = options?.enabled ?? !!querySubject;

  const queryKey = useMemo(
    () => [
      "past-questions",
      querySubject,
      queryTopic,
      options?.subtopicId,
      options?.type,
      queryYear,
      resolvedPage,
      queryLimit,
    ],
    [
      querySubject,
      queryTopic,
      options?.subtopicId,
      options?.type,
      queryYear,
      resolvedPage,
      queryLimit,
    ],
  );

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey,
    queryFn: () => {
      const params = new URLSearchParams({
        subject: querySubject,
        limit: queryLimit.toString(),
        offset: queryOffset.toString(),
      });
      if (queryTopic) params.set("topic", queryTopic);
      if (options?.subtopicId) params.set("subtopicId", options.subtopicId);
      if (options?.type) params.set("type", options.type);
      if (queryYear) params.set("year", queryYear.toString());
      return budgetFetch<{ questions: PastPaperQuestion[] }>(
        `/api/exam-papers/questions?${params.toString()}`,
        {},
        "FetchPastQuestions",
      );
    },
    enabled: isEnabled,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  const questions = data?.questions ?? [];
  const hasMore = questions.length >= (options?.limit ?? PAGE_SIZE);

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      if (options) return; // Don't modify URL when used with explicit params
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    },
    [options, pathname, router, searchParams],
  );

  const setSubject = useCallback(
    (value: string) =>
      updateParams({ subject: value, topic: undefined, year: undefined, page: undefined }),
    [updateParams],
  );

  const setTopic = useCallback(
    (value: string) => updateParams({ topic: value || undefined, page: undefined }),
    [updateParams],
  );

  const setYear = useCallback(
    (value: string) => updateParams({ year: value || undefined, page: undefined }),
    [updateParams],
  );

  const loadMore = useCallback(() => {
    if (options) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", (resolvedPage + 1).toString());
    router.replace(`${pathname}?${params.toString()}`);
  }, [options, resolvedPage, pathname, router, searchParams]);

  const clearFilters = useCallback(() => {
    if (options) return;
    router.replace(pathname);
  }, [options, pathname, router]);

  return {
    data,
    questions,
    isPending: isLoading,
    isLoading,
    isFetching,
    error,
    loadMore,
    hasMore,
    currentPage: resolvedPage,
    subject: querySubject,
    topic: queryTopic,
    year: queryYear,
    page: resolvedPage,
    setSubject,
    setTopic,
    setYear,
    clearFilters,
  };
}
