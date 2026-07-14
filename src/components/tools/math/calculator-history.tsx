"use client";

import { cn } from "@/lib/utils";

interface HistoryPanelProps {
  show: boolean;
  history: string[];
  onSelectResult: (result: string) => void;
}

export function HistoryPanel({ show, history, onSelectResult }: HistoryPanelProps) {
  return (
    <div
      className={cn(
        "mb-3 grid transition-[grid-template-rows,opacity] duration-200 ease-(--ease-ios-decelerate)",
        show ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
      )}
    >
      <div className="min-h-0 overflow-hidden">
        <div className="flex max-h-32 flex-col gap-1 overflow-y-auto rounded-xl border border-border/50 bg-system-surface p-3">
          {history.length === 0 && (
            <p className="py-2 text-center text-muted-foreground/40 text-xs">No history yet</p>
          )}
          {history.map((entry) => (
            <button
              type="button"
              key={`hist-${entry}`}
              onClick={() => onSelectResult(entry)}
              className="press-scale w-full cursor-pointer rounded py-0.5 text-left font-mono text-muted-foreground/60 text-xs transition-colors hover:text-muted-foreground"
            >
              {entry}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
