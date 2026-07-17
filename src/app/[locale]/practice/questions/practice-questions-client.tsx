"use client";

import { Suspense, useState } from "react";
import { usePastQuestions } from "@/hooks/use-past-questions";
import { PastQuestionFilters } from "@/components/practice/past-question-filters";
import { PastQuestionList } from "@/components/practice/past-question-list";

function PracticeQuestionsClientContent() {
  const {
    questions,
    isLoading,
    isFetching,
    subject,
    topic,
    year,
    hasMore,
    loadMore,
    setSubject,
    setTopic,
    setYear,
    clearFilters,
  } = usePastQuestions();

  const [practiceMode, setPracticeMode] = useState(false);
  const hasSubject = !!subject;

  return (
    <div className="flex flex-col gap-6 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Past Paper Questions</h1>
        {hasSubject && (
          <button
            type="button"
            onClick={() => setPracticeMode((prev) => !prev)}
            className="rounded-lg border border-border/60 bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent/5"
          >
            {practiceMode ? "Show Answers" : "Hide Answers"}
          </button>
        )}
      </div>

      <PastQuestionFilters
        subject={subject}
        topic={topic}
        year={year?.toString()}
        onSubjectChange={setSubject}
        onTopicChange={setTopic}
        onYearChange={setYear}
        onClear={clearFilters}
      />

      {hasSubject && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            {questions.length} question{questions.length !== 1 ? "s" : ""} found
          </span>
          {isFetching && <span className="ml-auto text-xs italic">Updating...</span>}
        </div>
      )}

      <PastQuestionList
        questions={questions}
        isLoading={isLoading}
        hasMore={hasMore}
        onLoadMore={loadMore}
        hasSubject={hasSubject}
        practiceMode={practiceMode || undefined}
      />
    </div>
  );
}

export function PracticeQuestionsClient() {
  return (
    <Suspense fallback={null}>
      <PracticeQuestionsClientContent />
    </Suspense>
  );
}
