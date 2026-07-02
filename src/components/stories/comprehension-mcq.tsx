"use client";

import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon";
import CheckmarkCircle01Icon from "@hugeicons/core-free-icons/CheckmarkCircle01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";

interface ComprehensionMcqProps {
  questionType: "mcq" | "true-false";
  options: string[];
  correctAnswer: string;
  selectedOption: string | null;
  isGraded: boolean;
  onSelect: (option: string) => void;
}

export function ComprehensionMcq({
  questionType,
  options,
  correctAnswer,
  selectedOption,
  isGraded,
  onSelect,
}: ComprehensionMcqProps) {
  const displayOptions = questionType === "true-false" ? ["True", "False"] : options;
  const showResult = isGraded;

  return (
    <div className="flex flex-col gap-2">
      {displayOptions.map((option) => {
        const isSelected = selectedOption === option;
        const isOptionCorrect = option === correctAnswer;
        return (
          <button
            key={option}
            type="button"
            disabled={isGraded}
            aria-pressed={isSelected}
            onClick={() => onSelect(option)}
            className={cn(
              "flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors",
              !showResult && isSelected && "border-(--system-accent) bg-(--system-accent)/5",
              !showResult && !isSelected && "hover:bg-muted/50",
              showResult && isOptionCorrect && "border-success/30 bg-success/10",
              showResult &&
                isSelected &&
                !isOptionCorrect &&
                "border-destructive/30 bg-destructive/10",
              !showResult && !isSelected && "border-border",
            )}
          >
            {showResult ? (
              <HugeiconsIcon
                icon={
                  isOptionCorrect
                    ? CheckmarkCircle01Icon
                    : isSelected
                      ? Cancel01Icon
                      : CheckmarkCircle01Icon
                }
                className={cn(
                  "size-4 shrink-0",
                  isOptionCorrect
                    ? "text-success"
                    : isSelected
                      ? "text-destructive"
                      : "text-muted-foreground/30",
                )}
              />
            ) : (
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border text-xs",
                  isSelected
                    ? "border-(--system-accent) bg-(--system-accent) text-white"
                    : "border-muted-foreground/30",
                )}
              >
                {isSelected ? (
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-4" />
                ) : null}
              </span>
            )}
            <span className="leading-relaxed">{option}</span>
          </button>
        );
      })}
    </div>
  );
}
