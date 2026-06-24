"use client";

import * as m from "motion/react-m";
import { useTranslations } from "next-intl";
import { memo } from "react";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { TTSButton } from "@/components/shared/tts-button";
import { Button } from "@/components/ui/button";
import type { Option } from "@/lib/question-engine/types";
import { cn } from "@/lib/utils";
import { iOSEase } from "@/lib/utils/animation";

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
        "grid gap-2",
        options.every((o) => o.text.length <= 30) ? "grid-cols-2" : "grid-cols-1",
      )}
    >
      {options.map((option, i) => {
        const isSelected = selectedOption === option.id;
        return (
          <m.div
            key={option.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: i * 0.05,
              duration: 0.25,
              ease: iOSEase,
            }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              variant="ghost"
              type="button"
              onClick={() => onSelect(option.id)}
              className={cn(
                "quiz-option-btn flex min-h-12 w-full items-center gap-3 rounded-lg border border-border bg-card p-4 text-left",
                isSelected && "border-(--system-accent) bg-(--system-accent-alpha-10)",
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full border font-medium text-sm",
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
      <Button onClick={onSubmit} disabled={!selectedOption} className="col-span-full mt-2">
        {t("quiz.checkAnswer")}
      </Button>
    </div>
  );
});
