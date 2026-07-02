"use client";

import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon";
import CheckmarkCircle01Icon from "@hugeicons/core-free-icons/CheckmarkCircle01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { cn } from "@/lib/utils";

interface ComprehensionFeedbackProps {
  isCorrect: boolean;
  score: number;
  explanation: string;
  questionType: string;
  correctAnswer: string;
}

export function ComprehensionFeedback({
  isCorrect,
  score,
  explanation,
  questionType,
  correctAnswer,
}: ComprehensionFeedbackProps) {
  return (
    <div className="grid grid-rows-[1fr] transition-[grid-template-rows,opacity] duration-300 ease-(--ease-ios-decelerate)">
      <div className="min-h-0 overflow-hidden">
        <div
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-3 font-medium text-sm",
            isCorrect ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
          )}
        >
          <HugeiconsIcon
            icon={isCorrect ? CheckmarkCircle01Icon : Cancel01Icon}
            className="size-4 shrink-0"
          />
          {isCorrect ? "Correct!" : "Incorrect"}
          <span className="ml-auto text-xs tabular-nums">{score}%</span>
        </div>

        {explanation && (
          <div className="mt-3 rounded-xl bg-muted/50 p-3 text-sm leading-relaxed">
            <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
              Explanation
            </span>
            <p className="mt-1">
              <MarkdownRenderer content={explanation} />
            </p>
          </div>
        )}

        {!isCorrect && (
          <div className="mt-2 text-muted-foreground text-xs">
            {questionType === "matching" ? (
              <span>Correct pairings shown above</span>
            ) : questionType === "true-false" || questionType === "mcq" ? (
              <span>Correct answer: {correctAnswer}</span>
            ) : (
              <span>Model answer: {correctAnswer}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
