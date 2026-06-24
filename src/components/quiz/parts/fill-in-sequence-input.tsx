"use client";

import * as m from "motion/react-m";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useDragSort } from "@/hooks/use-drag-sort";
import type { SequenceBlank, SequenceSlot } from "@/lib/question-engine/types";

interface FillInSequenceInputProps {
  sequence: SequenceSlot[];
  blanks: SequenceBlank[];
  shuffleDistractors?: boolean;
  onSubmit: (answers: Record<string, string>) => void;
}

export function FillInSequenceInput({
  sequence,
  blanks,
  shuffleDistractors = true,
  onSubmit,
}: FillInSequenceInputProps) {
  const t = useTranslations();

  const allOptions = useMemo(() => {
    const correct = blanks.map((b) => ({
      id: b.id,
      text: b.correctAnswer,
      isCorrect: true,
    }));
    const distractors = blanks.flatMap(
      (b) =>
        b.distractors?.map((d, i) => ({
          id: `${b.id}-dist-${i}`,
          text: d,
          isCorrect: false,
        })) ?? [],
    );
    const combined = shuffleDistractors
      ? [...correct, ...distractors].toSorted(() => Math.random() - 0.5)
      : [...correct, ...distractors];
    return combined;
  }, [blanks, shuffleDistractors]);

  const [assigned, setAssigned] = useState<Record<string, string>>({});
  const { draggedId, handleDragStart, handleDragEnd } = useDragSort();

  const unassignedOptions = useMemo(
    () => allOptions.filter((opt) => !Object.values(assigned).includes(opt.id)),
    [allOptions, assigned],
  );

  const handleBlankDragOver = useCallback((e: React.DragEvent, _blankId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDropOnBlank = useCallback(
    (e: React.DragEvent, blankId: string) => {
      e.preventDefault();
      const optId = e.dataTransfer.getData("text/plain");
      if (optId && allOptions.find((o) => o.id === optId)) {
        setAssigned((prev) => ({ ...prev, [blankId]: optId }));
      }
    },
    [allOptions],
  );

  const handleRemoveFromBlank = useCallback((blankId: string) => {
    setAssigned((prev) => {
      const next = { ...prev };
      delete next[blankId];
      return next;
    });
  }, []);

  const getAssignedText = useCallback(
    (blankId: string) => {
      const optId = assigned[blankId];
      if (!optId) return null;
      return allOptions.find((o) => o.id === optId)?.text ?? null;
    },
    [assigned, allOptions],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-1 leading-relaxed">
        {sequence.map((slot) => {
          if (slot.blankId) {
            const blankId = slot.blankId;
            const assignedText = getAssignedText(blankId);
            return (
              <button
                type="button"
                key={blankId}
                onDragOver={(e: React.DragEvent) => handleBlankDragOver(e, blankId)}
                onDragLeave={handleDragEnd}
                onDrop={(e: React.DragEvent) => handleDropOnBlank(e, blankId)}
                onClick={() => {
                  if (assignedText) handleRemoveFromBlank(blankId);
                }}
                onKeyDown={(e) => {
                  if (assignedText && (e.key === "Enter" || e.key === " ")) {
                    handleRemoveFromBlank(blankId);
                  }
                }}
                className={`inline-flex min-h-9 min-w-[80px] items-center justify-center rounded-lg border-2 border-dashed px-2 py-1 text-sm transition-[border-color,background-color] duration-150 focus-visible:ring-(--system-accent) focus-visible:ring-2 ${
                  assignedText
                    ? "cursor-pointer border-(--system-accent) bg-(--system-accent-alpha-10)"
                    : "border-muted-foreground/30"
                }`}
                aria-label={
                  assignedText
                    ? `Blank filled with ${assignedText}. Click to remove.`
                    : "Empty blank. Drag an option here."
                }
              >
                {assignedText ?? <span className="text-muted-foreground/50 text-xs">___</span>}
              </button>
            );
          }
          return (
            <span key={slot.text} className="text-sm">
              {slot.text}
            </span>
          );
        })}
      </div>

      {unassignedOptions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {unassignedOptions.map((opt) => {
            const isDragging = draggedId === opt.id;
            return (
              <m.div
                key={opt.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.15 }}
                className={`rounded-lg border px-3 py-1.5 text-sm ${
                  isDragging ? "opacity-40" : "border-border bg-card"
                }`}
              >
                <button
                  type="button"
                  draggable
                  aria-grabbed={isDragging}
                  onDragStart={(e: React.DragEvent) => handleDragStart(e, opt.id)}
                  onDragEnd={handleDragEnd}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                    }
                  }}
                  className="w-full cursor-grab rounded-md bg-transparent text-left focus-visible:ring-(--system-accent) focus-visible:ring-2 active:cursor-grabbing"
                >
                  {opt.text}
                </button>
              </m.div>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button
          onClick={() => {
            const optionMap = new Map(allOptions.map((o) => [o.id, o]));
            const answers: Record<string, string> = {};
            for (const blank of blanks) {
              const optId = assigned[blank.id];
              if (optId) {
                const opt = optionMap.get(optId);
                answers[blank.id] = opt?.text ?? "";
              }
            }
            onSubmit(answers);
          }}
          disabled={blanks.some((b) => !assigned[b.id])}
        >
          {t("quiz.submitAnswer")}
        </Button>
        {blanks.some((b) => !assigned[b.id]) && (
          <p className="text-muted-foreground text-xs">Fill all blanks to submit</p>
        )}
      </div>
    </div>
  );
}
