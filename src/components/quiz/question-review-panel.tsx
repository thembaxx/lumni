"use client";

import CancelCircleIcon from "@hugeicons/core-free-icons/CancelCircleIcon";
import CheckmarkCircle01Icon from "@hugeicons/core-free-icons/CheckmarkCircle01Icon";
import Refresh01Icon from "@hugeicons/core-free-icons/Refresh01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Question, UserAnswer } from "@/lib/question-engine/types";
import { cn } from "@/lib/utils";

function getUserAnswerText(answer?: UserAnswer): string {
  if (!answer) return "Skipped";
  if (answer.type === "option-ids" && Array.isArray(answer.value)) {
    return (answer.value as string[]).join(", ");
  }
  if (answer.type === "text" || answer.type === "numeric") {
    return String(answer.value ?? "");
  }
  return JSON.stringify(answer.value ?? "");
}

function getCorrectAnswerText(q: Question): string {
  if (q.type === "multiple-choice") {
    const body = q.body as {
      options?: { id: string; text: string; isCorrect: boolean }[];
    };
    const correct = body?.options?.find((o) => o.isCorrect);
    return correct?.text ?? "";
  }
  if (q.type === "short-answer") {
    const body = q.body as {
      modelAnswer?: string;
      acceptableAnswers?: string[];
    };
    return body?.modelAnswer ?? body?.acceptableAnswers?.[0] ?? "";
  }
  if (q.type === "calculation") {
    const body = q.body as { correctValue?: number; unit?: string };
    return `${body?.correctValue ?? ""} ${body?.unit ?? ""}`.trim();
  }
  return q.explanation?.split(".")[0] ?? "";
}

interface QuestionReviewPanelProps {
  questions: Question[];
  correctness: boolean[];
  userAnswers?: UserAnswer[];
  subject: string;
  onPracticeMistakes?: () => void;
  correctAnswers: number;
  totalQuestions: number;
}

export function QuestionReviewPanel({
  questions,
  correctness,
  userAnswers,
  subject,
  onPracticeMistakes,
  correctAnswers,
  totalQuestions,
}: QuestionReviewPanelProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-2">
      {questions.map((q, i) => {
        const isCorrect = correctness[i] ?? false;
        const isExpanded = expandedIndex === i;
        const userAns = userAnswers?.[i];
        return (
          <Card
            key={q.id}
            className={cn(
              "overflow-hidden",
              isCorrect ? "border-success/20" : "border-destructive/20",
            )}
          >
            <button
              type="button"
              onClick={() => setExpandedIndex(isExpanded ? null : i)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
              aria-expanded={isExpanded}
            >
              <HugeiconsIcon
                icon={isCorrect ? CheckmarkCircle01Icon : CancelCircleIcon}
                className={cn("size-5 shrink-0", isCorrect ? "text-success" : "text-destructive")}
              />
              <span className="flex-1 truncate font-medium text-sm">Question {i + 1}</span>
              <span className="shrink-0 text-muted-foreground text-xs">
                {isExpanded ? "▲" : "▼"}
              </span>
            </button>
            {isExpanded && (
              <div className="border-t px-4 py-3 flex flex-col gap-3">
                <MarkdownRenderer content={q.questionText} subject={subject} />
                <div className="grid grid-cols-2 gap-3">
                  {userAns && (
                    <div className="rounded-lg bg-muted p-3">
                      <p className="mb-1 font-medium text-(--fs-caption-3) text-muted-foreground uppercase tracking-wider">
                        Your Answer
                      </p>
                      <p className="overflow-wrap-anywhere text-sm">{getUserAnswerText(userAns)}</p>
                    </div>
                  )}
                  <div
                    className={cn(
                      "rounded-lg p-3",
                      isCorrect ? "bg-success/10" : "bg-destructive/10",
                    )}
                  >
                    <p className="mb-1 font-medium text-(--fs-caption-3) text-muted-foreground uppercase tracking-wider">
                      {isCorrect ? "Answer" : "Correct Answer"}
                    </p>
                    <p className="overflow-wrap-anywhere text-sm">{getCorrectAnswerText(q)}</p>
                  </div>
                </div>
                {q.explanation && (
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="mb-1 font-medium text-(--fs-caption-3) text-muted-foreground uppercase tracking-wider">
                      Explanation
                    </p>
                    <MarkdownRenderer content={q.explanation} subject={subject} />
                  </div>
                )}
              </div>
            )}
          </Card>
        );
      })}
      {totalQuestions - correctAnswers > 0 && onPracticeMistakes && (
        <Button variant="secondary" size="sm" onClick={onPracticeMistakes} className="gap-2">
          <HugeiconsIcon icon={Refresh01Icon} className="size-4" />
          Practice These Topics
        </Button>
      )}
    </div>
  );
}
