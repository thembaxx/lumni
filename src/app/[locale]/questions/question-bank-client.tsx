"use client";

import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Anim } from "@/components/shared/anim";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubjectSelect } from "@/components/ui/subject-select";
import { curriculumRegistry } from "@/curriculum";
import type { SubjectCurriculum } from "@/curriculum/types";
import { usePastQuestions } from "@/hooks/use-past-questions";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth/auth-context";

const QUESTION_TYPES = [
  { value: "", label: "All Types" },
  { value: "multiple-choice", label: "Multiple Choice" },
  { value: "short-answer", label: "Short Answer" },
  { value: "long-answer", label: "Long Answer" },
  { value: "calculation", label: "Calculation" },
  { value: "essay", label: "Essay" },
];

function LockIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <title>Lock</title>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function QuestionCard({
  question,
  index,
}: {
  question: NonNullable<ReturnType<typeof usePastQuestions>["data"]>["questions"][number];
  index: number;
}) {
  const [showAnswer, setShowAnswer] = useState(false);
  const { push } = useRouter();

  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="rounded-2xl border bg-card p-5 shadow-sm"
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="rounded-full text-xs">
            {question.year} P{question.paperNumber}
          </Badge>
          {question.topic && (
            <Badge variant="outline" className="rounded-full text-xs">
              {question.topic}
            </Badge>
          )}
          {question.marks > 0 && (
            <span className="text-muted-foreground text-xs">{question.marks} marks</span>
          )}
          {question.bloomLevel && (
            <Badge variant="outline" className="rounded-full text-(--fs-caption-3) uppercase">
              {question.bloomLevel}
            </Badge>
          )}
        </div>

        <div className="text-pretty text-sm leading-relaxed">
          <MarkdownRenderer content={question.questionText} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAnswer(!showAnswer)}
            className="text-xs"
          >
            {showAnswer ? "Hide Answer" : "Show Answer"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              push(
                `/quiz?subject=${encodeURIComponent(question.subject)}&topic=${encodeURIComponent(question.topic || "")}&count=5`,
              )
            }
            className="text-xs"
          >
            Practice
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              push(
                `/solve?question=${encodeURIComponent(question.questionText)}&subject=${encodeURIComponent(question.subject)}`,
              )
            }
            className="text-xs"
          >
            Discuss
          </Button>
        </div>

        <AnimatePresence>
          {showAnswer && (
            <m.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-2 rounded-xl border bg-muted/30 p-4 text-sm leading-relaxed">
                <p className="mb-1 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  Answer
                </p>
                <MarkdownRenderer content={question.answerText} />
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </m.div>
  );
}

type FiltersState = {
  selectedSubject: string;
  selectedTopic: string;
  selectedSubtopic: string;
  selectedType: string;
  selectedYear: number | undefined;
  curriculum: SubjectCurriculum | null;
};

type FiltersAction =
  | { type: "setSubject"; subject: string }
  | { type: "curriculumLoaded"; subject: string; curriculum: SubjectCurriculum }
  | { type: "setTopic"; topic: string }
  | { type: "setSubtopic"; subtopic: string }
  | { type: "setType"; type_: string }
  | { type: "setYear"; year: number | undefined }
  | { type: "clearFilters" };

function filtersReducer(state: FiltersState, action: FiltersAction): FiltersState {
  switch (action.type) {
    case "setSubject":
      return {
        ...state,
        selectedSubject: action.subject,
        selectedTopic: "",
        selectedSubtopic: "",
        curriculum: null,
      };
    case "curriculumLoaded":
      return {
        ...state,
        curriculum: action.curriculum,
        selectedTopic: "",
        selectedSubtopic: "",
      };
    case "setTopic":
      return { ...state, selectedTopic: action.topic };
    case "setSubtopic":
      return { ...state, selectedSubtopic: action.subtopic };
    case "setType":
      return { ...state, selectedType: action.type_ };
    case "setYear":
      return { ...state, selectedYear: action.year };
    case "clearFilters":
      return {
        ...state,
        selectedTopic: "",
        selectedSubtopic: "",
        selectedType: "",
        selectedYear: undefined,
      };
    default:
      return state;
  }
}

const INITIAL_FILTERS: FiltersState = {
  selectedSubject: "",
  selectedTopic: "",
  selectedSubtopic: "",
  selectedType: "",
  selectedYear: undefined,
  curriculum: null,
};

export function QuestionBankClient() {
  const { user } = useAuth();
  const { push } = useRouter();
  const [filters, dispatch] = useReducer(filtersReducer, INITIAL_FILTERS);

  const {
    selectedSubject,
    selectedTopic,
    selectedSubtopic,
    selectedType,
    selectedYear,
    curriculum,
  } = filters;

  const years = useMemo(() => {
    const y: number[] = [];
    for (let i = 2026; i >= 2015; i--) y.push(i);
    return y;
  }, []);

  useEffect(() => {
    if (!selectedSubject) return;
    curriculumRegistry.getSubject(selectedSubject).then((c) => {
      dispatch({
        type: "curriculumLoaded",
        subject: selectedSubject,
        curriculum: c as SubjectCurriculum,
      });
    });
  }, [selectedSubject]);

  const currentTopic = useMemo(() => {
    if (!curriculum || !selectedTopic) return null;
    return curriculum.topics.find((t) => t.id === selectedTopic) ?? null;
  }, [curriculum, selectedTopic]);

  const {
    data,
    isPending,
    error: queryError,
  } = usePastQuestions({
    subject: selectedSubject || undefined,
    subtopicId: selectedSubtopic || undefined,
    type: selectedType || undefined,
    year: selectedYear,
    limit: 50,
    enabled: !!selectedSubject,
  });

  const clearFilters = useCallback(() => {
    dispatch({ type: "clearFilters" });
  }, []);

  const hasFilters = selectedTopic || selectedSubtopic || selectedType || selectedYear;

  if (!user) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center gap-4 py-24">
          <div className="text-muted-foreground" aria-hidden="true">
            <LockIcon />
          </div>
          <h1 className="text-center font-semibold text-2xl">Past Exam Questions</h1>
          <p className="max-w-xs text-center text-muted-foreground text-sm">
            Sign in to browse and practice past exam questions.
          </p>
          <div className="flex gap-3">
            <Button onClick={() => push("/auth/sign-in")}>Sign In</Button>
            <Button variant="outline" onClick={() => push("/auth/sign-up")}>
              Create Account
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex flex-col gap-6 py-6">
        <div className="flex flex-col gap-1">
          <h1 className="font-semibold text-2xl">Past Exam Questions</h1>
          <p className="text-muted-foreground text-sm">
            Browse past paper questions by subject, topic, and year.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-48 flex-1">
              <SubjectSelect
                value={selectedSubject}
                onChange={(s: string) => dispatch({ type: "setSubject", subject: s })}
              />
            </div>

            {curriculum && (
              <div className="min-w-40 flex-1">
                <Select
                  value={selectedTopic || "__all"}
                  onValueChange={(v) =>
                    dispatch({
                      type: "setTopic",
                      topic: v === "__all" ? "" : (v ?? ""),
                    })
                  }
                >
                  <SelectTrigger aria-label="Filter by topic">
                    <SelectValue placeholder="All Topics" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all">All Topics</SelectItem>
                    {curriculum.topics.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {currentTopic && currentTopic.subtopics.length > 0 && (
              <div className="min-w-40 flex-1">
                <Select
                  value={selectedSubtopic || "__all"}
                  onValueChange={(v) =>
                    dispatch({
                      type: "setSubtopic",
                      subtopic: v === "__all" ? "" : (v ?? ""),
                    })
                  }
                >
                  <SelectTrigger aria-label="Filter by subtopic">
                    <SelectValue placeholder="All Subtopics" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all">All Subtopics</SelectItem>
                    {currentTopic.subtopics.map((st) => (
                      <SelectItem key={st.id} value={st.id}>
                        {st.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="min-w-32 flex-1">
              <Select
                value={selectedType || "__all"}
                onValueChange={(v) =>
                  dispatch({
                    type: "setType",
                    type_: v === "__all" ? "" : (v ?? ""),
                  })
                }
              >
                <SelectTrigger aria-label="Filter by question type">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  {QUESTION_TYPES.map((t) => (
                    <SelectItem key={t.value || "__all"} value={t.value || "__all"}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-28 flex-1">
              <Select
                value={selectedYear ? String(selectedYear) : "__all"}
                onValueChange={(v) =>
                  dispatch({
                    type: "setYear",
                    year: v === "__all" ? undefined : Number(v ?? "0"),
                  })
                }
              >
                <SelectTrigger aria-label="Filter by year">
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all">All Years</SelectItem>
                  {years.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="self-start text-muted-foreground text-xs"
            >
              Clear filters
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {isPending && (
            <div className="flex flex-col gap-3">
              {[...Array(3)].map((_, i) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton loader
                  key={i}
                  className="h-32 animate-pulse rounded-2xl bg-muted"
                />
              ))}
            </div>
          )}

          {queryError && (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-center text-destructive text-sm">
              Failed to load questions. Please try again.
            </div>
          )}

          {!isPending && !queryError && data && data.questions.length === 0 && (
            <Anim>
              <div className="rounded-2xl border bg-card p-8 text-center text-muted-foreground text-sm">
                {selectedSubject
                  ? "No questions match your filters."
                  : "Select a subject to browse past exam questions."}
              </div>
            </Anim>
          )}

          {!isPending && data && (
            <div className="flex flex-col gap-3">
              {data.questions.map((q, i) => (
                <QuestionCard key={q.id} question={q} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
