"use client";

import { cn } from "@/lib/utils";
import type { QuestionPart } from "@/types/exam-paper";

interface QuestionNavigatorProps {
  totalParts: { sectionId: string; questionId: string; part: QuestionPart }[];
  currentPartId: string | null;
  answers: Record<string, { value: string | string[] }>;
  flags: string[];
  onNavigate: (partId: string) => void;
}

export function SessionQuestionNavigator({
  totalParts,
  currentPartId,
  answers,
  flags,
  onNavigate,
}: QuestionNavigatorProps) {
  const groups: Record<string, typeof totalParts> = {};
  for (const item of totalParts) {
    const key = `${item.sectionId}-${item.questionId}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }

  return (
    <div className="flex max-h-80 flex-col gap-2 overflow-y-auto">
      {Object.entries(groups).map(([key, items]) => {
        return (
          <div key={key} className="flex flex-wrap gap-1.5">
            {items.map((item) => {
              const fullId = `${item.sectionId}-${item.questionId}-${item.part.id}`;
              const isCurrent = fullId === currentPartId;
              const isAnswered = !!answers[fullId];
              const isFlagged = flags.includes(fullId);
              const partSuffix = item.part.id.split("-").pop() ?? "";
              const label = `${item.questionId}.${partSuffix}`;
              return (
                <button
                  key={fullId}
                  type="button"
                  onClick={() => onNavigate(fullId)}
                  className={cn(
                    "size-8 rounded-lg font-medium text-xs transition-colors",
                    isCurrent && "ring-2 ring-(--system-accent)",
                    isAnswered && !isCurrent && "bg-success/20 text-success",
                    !isAnswered && !isCurrent && "bg-muted text-muted-foreground",
                    isFlagged && "ring-1 ring-warning",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
