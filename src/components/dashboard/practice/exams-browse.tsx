"use client";

import BookOpen01Icon from "@hugeicons/core-free-icons/BookOpen01Icon";
import Calendar01Icon from "@hugeicons/core-free-icons/Calendar01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence } from "motion/react";
import { useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { Anim } from "@/components/shared/anim";
import { Button } from "@/components/ui/button";
import { useExams } from "@/hooks/use-exams";
import { useNavigationDirection } from "@/hooks/use-navigation-direction";
import { ExamEmptyState } from "./exams-browse/exam-empty-state";
import { ExamErrorState } from "./exams-browse/exam-error-state";
import { ExamFilters } from "./exams-browse/exam-filters";
import { ExamGroupList } from "./exams-browse/exam-group-list";
import { ExamLoadingState } from "./exams-browse/exam-loading-state";
import { ExamSearchBar } from "./exams-browse/exam-search-bar";

export function ExamsBrowse() {
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const { push } = useNavigationDirection();
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedSession, setSelectedSession] = useState<string>("all");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const { exams, groupedExams, isLoading, error } = useExams({
    search: searchQuery,
    year: selectedYear,
    subject: selectedSubject,
    session: selectedSession,
    language: selectedLanguage !== "all" ? selectedLanguage : undefined,
  });

  const clearFilters = () => {
    setSelectedSubject("");
    setSelectedYear(null);
    setSelectedSession("all");
    setSelectedLanguage("all");
    setSearchQuery("");
  };

  const hasActiveFilters = !!(
    selectedSubject ||
    selectedYear ||
    selectedSession !== "all" ||
    selectedLanguage !== "all" ||
    searchQuery
  );

  const handleToggleExpand = (subject: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(subject)) {
        next.delete(subject);
      } else {
        next.add(subject);
      }
      return next;
    });
  };

  return (
    <div className="min-h-dvh bg-system-grouped pt-4">
      <PageContainer className="flex flex-col gap-8">
        <Anim>
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h1 className="ios-title-1 font-semibold text-foreground tracking-tight">
                Past Exam Papers
              </h1>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => {
                    const params = new URLSearchParams({
                      pastPaperMode: "true",
                    });
                    push(`/quiz?${params.toString()}`);
                  }}
                  className="gap-1.5 rounded-full text-xs"
                >
                  <HugeiconsIcon icon={BookOpen01Icon} className="size-3.5" />
                  Practice
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => push("/exam-dates")}
                  className="gap-1.5 rounded-full border-border/60 text-xs"
                >
                  <HugeiconsIcon icon={Calendar01Icon} className="size-3.5" />
                  Exam Dates
                </Button>
              </div>
            </div>

            <div className="relative flex flex-col gap-4">
              <ExamSearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />

              <ExamFilters
                selectedSubject={selectedSubject}
                selectedYear={selectedYear}
                selectedSession={selectedSession}
                selectedLanguage={selectedLanguage}
                hasActiveFilters={hasActiveFilters}
                onSubjectChange={setSelectedSubject}
                onYearChange={setSelectedYear}
                onSessionChange={setSelectedSession}
                onLanguageChange={setSelectedLanguage}
                onClearFilters={clearFilters}
              />
            </div>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <div className="grow">
              {isLoading ? (
                <ExamLoadingState />
              ) : error ? (
                <ExamErrorState />
              ) : exams.length === 0 ? (
                <ExamEmptyState hasActiveFilters={hasActiveFilters} onClearFilters={clearFilters} />
              ) : (
                <ExamGroupList
                  groupedExams={groupedExams}
                  expandedGroups={expandedGroups}
                  onToggleExpand={handleToggleExpand}
                />
              )}
            </div>
          </AnimatePresence>
        </Anim>
      </PageContainer>
    </div>
  );
}
