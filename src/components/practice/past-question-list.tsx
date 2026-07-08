"use client";

import type { PastPaperQuestion } from "@/lib/exam-paper-ingestion/past-paper-question-types";
import { PastQuestionCard } from "@/components/practice/past-question-card";

interface PastQuestionListProps {
  questions: PastPaperQuestion[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  hasSubject: boolean;
}

export function PastQuestionList({
  questions,
  isLoading,
  hasMore,
  onLoadMore,
  hasSubject,
}: PastQuestionListProps) {
  if (!hasSubject) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-4 rounded-full bg-muted/30 p-6">
          <svg
            className="size-10 text-muted-foreground/40"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-foreground">Select a subject and topic</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Choose a subject from the filters to browse past paper questions
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-xl border border-border/60 bg-card p-4">
            <div className="mb-3 flex items-center gap-2">
              <div className="h-4 w-20 rounded bg-muted" />
              <div className="h-4 w-16 rounded bg-muted" />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="h-3 w-full rounded bg-muted" />
              <div className="h-3 w-3/4 rounded bg-muted" />
            </div>
            <div className="h-10 w-full rounded-lg bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-4 rounded-full bg-muted/30 p-6">
          <svg
            className="size-10 text-muted-foreground/40"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-foreground">No questions found</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Try adjusting your topic or year selection
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {questions.map((q) => (
        <PastQuestionCard key={q.id} question={q} />
      ))}
      {hasMore && (
        <button
          type="button"
          onClick={onLoadMore}
          className="mt-2 rounded-lg border border-border/60 bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent/5"
        >
          Load more
        </button>
      )}
    </div>
  );
}
