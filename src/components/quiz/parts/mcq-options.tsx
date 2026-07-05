"use client";

import { useTranslations } from "next-intl";
import { memo } from "react";
import * as m from "motion/react-m";
import { useReducedMotion } from "motion/react";
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
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      className={cn(
        "grid gap-2.5",
        options.every((o) => o.text.length <= 30) ? "grid-cols-2" : "grid-cols-1",
      )}
    >
      {options.map((option, idx) => {
        const isSelected = selectedOption === option.id;
        return (
          <m.div
            key={option.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : {
                    delay: 0.12 + idx * 0.04,
                    type: "spring",
                    stiffness: 300,
                    damping: 26,
                    mass: 0.8,
                    bounce: 0,
                  }
            }
          >
            <Button
              variant="ghost"
              type="button"
              onClick={() => onSelect(option.id)}
              className={cn(
                "quiz-option-btn press-glow flex min-h-14 w-full items-center gap-3 rounded-(--radius-interactive) border border-border bg-card p-4 text-left",
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
          </m.div>
        );
      })}
      <m.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : { delay: 0.12 + options.length * 0.04, duration: 0.2, ease: [0.16, 1, 0.3, 1] }
        }
      >
        <Button
          onClick={onSubmit}
          disabled={!selectedOption}
          className="col-span-full mt-2 min-h-12"
        >
          {t("quiz.checkAnswer")}
        </Button>
      </m.div>
    </div>
  );
});
