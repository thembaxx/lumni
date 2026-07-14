"use client";

import { useState } from "react";
import type { PastPaperQuestion } from "@/lib/exam-paper-ingestion/past-paper-question-types";
import { formatSubjectLabel } from "@/lib/subjects";
import { HugeiconsIcon } from "@hugeicons/react";
import BookOpen01Icon from "@hugeicons/core-free-icons/BookOpen01Icon";
import { Badge } from "@/components/ui/badge";

interface PastQuestionCardProps {
  question: PastPaperQuestion;
}

function difficultyLabel(marks: number): string {
  if (marks <= 2) return "Easy";
  if (marks <= 5) return "Medium";
  return "Hard";
}

function difficultyColor(marks: number): string {
  if (marks <= 2) return "text-success";
  if (marks <= 5) return "text-warning";
  return "text-destructive";
}

export function PastQuestionCard({ question }: PastQuestionCardProps) {
  const [practiceMode, setPracticeMode] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const subjectName = formatSubjectLabel(question.subject);

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 transition-colors hover:border-border">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="gap-1 bg-system-accent/10 text-system-accent">
                <HugeiconsIcon icon={BookOpen01Icon} className="size-3" />
                {subjectName}
              </Badge>
              <span className="tabular-nums">
                {question.year} P{question.paperNumber}
              </span>
              {question.marks > 0 && <span>{question.marks} marks</span>}
              <span className={difficultyColor(question.marks)}>
                {difficultyLabel(question.marks)}
              </span>
            </div>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-foreground line-clamp-3">
          {question.questionText}
        </p>

        {!practiceMode ? (
          <div className="flex flex-col gap-2">
            <div className="rounded-lg bg-muted/30 p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1">Answer</p>
              <p className="text-sm text-foreground">{question.answerText}</p>
            </div>
            <button
              type="button"
              onClick={() => setPracticeMode(true)}
              className="self-start rounded-lg bg-system-accent px-4 py-1.5 text-xs font-medium text-system-accent-foreground transition-colors hover:bg-system-accent/90"
            >
              Practice
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {!revealed ? (
              <button
                type="button"
                onClick={() => setRevealed(true)}
                className="self-start rounded-lg border border-border bg-card px-4 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent/5"
              >
                Reveal Answer
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="rounded-lg bg-success/10 p-3">
                  <p className="text-xs font-medium text-success mb-1">Answer</p>
                  <p className="text-sm text-foreground">{question.answerText}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPracticeMode(false);
                    setRevealed(false);
                  }}
                  className="self-start text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  Back to browse
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
