"use client";

import LockIcon from "@hugeicons/core-free-icons/LockIcon";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { FadeIn } from "@/components/shared/fade-in";
import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { AmbientGradient } from "@/components/shared/ambient-gradient";
import { PageContainer } from "@/components/layout/page-container";
import { motionEase } from "@/lib/utils/animation";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Anim } from "@/components/shared/anim";
import { EmptyStateWithIllustration } from "@/components/shared/empty-state";
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
import {
  QUESTION_TYPES,
  filtersReducer,
  INITIAL_FILTERS,
  hasActiveFilters,
  buildYearsRange,
  findCurrentTopic,
} from "./filters-state";
import { buildQueryConfig } from "./pagination";

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
    <FadeIn
      direction="up"
      distance={12}
      duration={0.3}
      delay={index * 0.04}
      className="rounded-2xl border bg-card p-5 shadow-level-1"
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

        <AnimatePresence initial={false}>
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
    </FadeIn>
  );
}

export function QuestionBankClient() {
  const { user, isAnonymous } = useAuth();
  const isLoggedIn = !!user && !isAnonymous;
  const { push } = useRouter();
  const [filters, dispatch] = useReducer(filtersReducer, INITIAL_FILTERS);
  const years = useMemo(() => buildYearsRange(), []);

  const {
    selectedSubject,
    selectedTopic,
    selectedSubtopic,
    selectedType,
    selectedYear,
    curriculum,
  } = filters;

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

  const currentTopic = useMemo(
    () => findCurrentTopic(curriculum, selectedTopic),
    [curriculum, selectedTopic],
  );

  const { data, isPending, error: queryError } = usePastQuestions(buildQueryConfig(filters));

  const clearFilters = useCallback(() => {
    dispatch({ type: "clearFilters" });
  }, []);

  const filterActive = hasActiveFilters(filters);

  if (!isLoggedIn) {
    return (
      <EmptyStateWithIllustration
        icon={LockIcon}
        title="Sign in to access Past Exam Questions"
        description="Create an account or sign in to browse and practice past exam questions."
        action={{
          label: "Sign In",
          onClick: () => push("/auth/sign-in?redirect=/questions"),
        }}
        secondaryAction={{
          label: "Create Account",
          onClick: () => push("/auth/sign-up?redirect=/questions"),
        }}
      />
    );
  }

  return (
    <div className="min-h-dvh bg-system-grouped pt-4 pb-24">
      <AmbientGradient variant="quiz" />
      <PageContainer className="flex flex-col gap-6">
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: motionEase }}
        >
          <h1 className="ios-title-1 font-extrabold text-foreground tracking-tight">
            Past Exam Questions
          </h1>
          <p className="text-muted-foreground text-sm">
            Browse past paper questions by subject, topic, and year.
          </p>
        </m.div>

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
                    {curriculum.topics.map((t: { id: string; name: string }) => (
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
                    {currentTopic.subtopics.map((st: { id: string; name: string }) => (
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
                  {QUESTION_TYPES.map((t: { value: string; label: string }) => (
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
                  {years.map((y: number) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {filterActive && (
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
      </PageContainer>
    </div>
  );
}
