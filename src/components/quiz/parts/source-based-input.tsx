"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Button } from "@/components/ui/button";
import type { UserAnswer } from "@/lib/question-engine/types";

interface SourceBasedInputProps {
  body: Record<string, unknown>;
  effectiveSubject: string;
  onGrade: (answer: UserAnswer) => Promise<void>;
}

export function SourceBasedInput({ body, effectiveSubject, onGrade }: SourceBasedInputProps) {
  const t = useTranslations();
  const source = body.source as Record<string, unknown> | undefined;
  const subQuestions = body.subQuestions as Record<string, unknown>[] | undefined;
  const [partAnswers, setPartAnswers] = useState<Record<string, string>>({});

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 rounded-lg bg-muted/30 p-4 text-sm">
        <MarkdownRenderer content={(source?.content as string) ?? ""} subject={effectiveSubject} />
        {!!source?.attribution && (
          <p className="text-muted-foreground text-xs">
            {t("quiz.sourceAttribution", {
              attribution: String(source.attribution),
            })}
          </p>
        )}
      </div>
      {subQuestions?.map((sq, i: number) => {
        const sqId = String((sq as Record<string, unknown>).id ?? i);
        return (
          <div key={sqId} className="flex flex-col gap-2 rounded-lg border p-3">
            <p className="mb-1 font-medium text-sm">
              {String((sq as Record<string, unknown>).questionText ?? "")}
            </p>
            <input
              type="text"
              className="w-full rounded-md border bg-transparent px-3 py-1.5 text-base outline-none focus:ring-2 focus:ring-(--system-accent)"
              placeholder={t("quiz.answerPlaceholder")}
              value={partAnswers[sqId] ?? ""}
              onChange={(e) =>
                setPartAnswers((prev) => ({
                  ...prev,
                  [sqId]: e.target.value,
                }))
              }
              aria-label={`Answer for question ${i + 1}`}
            />
          </div>
        );
      })}
      <Button
        onClick={() => {
          onGrade({
            type: "mixed",
            value:
              subQuestions?.map((sq: Record<string, unknown>, i: number) => {
                const sqId = String(sq.id ?? i);
                return {
                  partId: sqId,
                  answer: {
                    type: "text",
                    value: partAnswers[sqId] ?? "",
                  },
                };
              }) ?? [],
          });
        }}
        disabled={
          !subQuestions ||
          subQuestions.length === 0 ||
          Object.values(partAnswers).every((v) => !v.trim())
        }
      >
        {t("quiz.submitAnswer")}
      </Button>
    </div>
  );
}
