"use client";

import { Suspense } from "react";
import { usePastQuestions } from "@/hooks/use-past-questions";
import { PastQuestionFilters } from "@/components/practice/past-question-filters";
import { PastQuestionList } from "@/components/practice/past-question-list";
import { PageContainer } from "@/components/layout/page-container";
import { HugeiconsIcon } from "@hugeicons/react";
import BookOpen01Icon from "@hugeicons/core-free-icons/BookOpen01Icon";

function PastQuestionBrowserContent() {
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

  const hasSubject = !!subject;

  return (
    <PageContainer>
      <div className="flex flex-col gap-6 py-6">
        <div>
          <h1 className="ios-title-1 font-extrabold text-foreground tracking-tight">
            Question Bank
          </h1>
          <p className="text-muted-foreground text-sm">
            Browse past paper questions by subject and topic
          </p>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
          <aside className="w-full shrink-0 lg:w-64">
            <div className="sticky top-24 rounded-xl border border-border/60 bg-card p-4">
              <PastQuestionFilters
                subject={subject}
                topic={topic}
                year={year?.toString()}
                onSubjectChange={setSubject}
                onTopicChange={setTopic}
                onYearChange={setYear}
                onClear={clearFilters}
              />
            </div>
          </aside>

          <main className="min-w-0 flex-1">
            {hasSubject && (
              <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                <HugeiconsIcon icon={BookOpen01Icon} className="size-4" />
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
            />
          </main>
        </div>
      </div>
    </PageContainer>
  );
}

export function PastQuestionBrowser() {
  return (
    <Suspense fallback={null}>
      <PastQuestionBrowserContent />
    </Suspense>
  );
}
