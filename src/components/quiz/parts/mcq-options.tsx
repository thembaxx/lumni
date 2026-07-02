"use client";

import { useTranslations } from "next-intl";
import { memo } from "react";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { TTSButton } from "@/components/shared/tts-button";
import { Button } from "@/components/ui/button";
import type { Option } from "@/lib/question-engine/types";
import { cn } from "@/lib/utils";

export const MCQOptions = memo(function MCQOptions({
  options,
  selectedOption,
  effectiveSubject,
  onSelect,
  onSubmit,
}: {
  options: Option[];
  selectedOption: string | null;
  effectiveSubject: string;
  onSelect: (optionId: string) => void;
  onSubmit: () => void;
}) {
  const t = useTranslations();

  return (
    <div
      className={cn(
        "grid gap-2.5",
        options.every((o) => o.text.length <= 30) ? "grid-cols-2" : "grid-cols-1",
      )}
    >
      {options.map((option) => {
        const isSelected = selectedOption === option.id;
        return (
          <div key={option.id}>
            <Button
              variant="ghost"
              type="button"
              onClick={() => onSelect(option.id)}
              className={cn(
                "quiz-option-btn press-glow flex min-h-[56px] w-full items-center gap-3 rounded-(--radius-interactive) border border-border bg-card p-4 text-left",
                isSelected && "border-(--system-accent) bg-(--system-accent-alpha-10)",
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border font-semibold text-sm",
                  isSelected
                    ? "border-(--system-accent) bg-(--system-accent) text-background"
                    : "border-muted-foreground/30",
                )}
              >
                {option.id}
              </span>
              <span className="flex-1 font-medium">
                <MarkdownRenderer content={option.text} subject={effectiveSubject} />
              </span>
              {option.text.length > 80 && <TTSButton text={option.text} />}
            </Button>
          </div>
        );
      })}
      <Button
        onClick={onSubmit}
        disabled={!selectedOption}
        className="col-span-full mt-2 min-h-[48px]"
      >
        {t("quiz.checkAnswer")}
      </Button>
    </div>
  );
});
