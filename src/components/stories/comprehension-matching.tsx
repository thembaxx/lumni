"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ComprehensionMatchingProps {
  pairs: { left: string; right: string }[];
  userPairs: Map<number, number>;
  selectedLeftIdx: number | null;
  isGraded: boolean;
  onLeftClick: (idx: number) => void;
  onRightClick: (idx: number) => void;
  onRemovePair: (leftIdx: number) => void;
}

export function ComprehensionMatching({
  pairs,
  userPairs,
  selectedLeftIdx,
  isGraded,
  onLeftClick,
  onRightClick,
  onRemovePair,
}: ComprehensionMatchingProps) {
  const leftItems = pairs.map((p) => p.left);
  const rightItems = pairs.map((p) => p.right);
  const showResult = isGraded;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
            Items
          </span>
          {leftItems.map((item, idx) => {
            const isPaired = userPairs.has(idx);
            const isSelected = selectedLeftIdx === idx;
            const pairedRightIdx = userPairs.get(idx);
            const rightItem = pairedRightIdx !== undefined ? rightItems[pairedRightIdx] : undefined;
            const isCorrectPair =
              showResult &&
              isPaired &&
              rightItem !== undefined &&
              pairs.some((p) => p.left === item && p.right === rightItem);
            return (
              <button
                key={`left-${item}`}
                type="button"
                disabled={showResult}
                aria-pressed={isSelected}
                aria-label={`Match item: ${item}`}
                onClick={() => onLeftClick(idx)}
                className={cn(
                  "rounded-xl border px-3 py-2 text-left text-sm transition-colors",
                  showResult && isCorrectPair && "border-success/30 bg-success/10",
                  showResult &&
                    isPaired &&
                    !isCorrectPair &&
                    "border-destructive/30 bg-destructive/10",
                  !showResult && isSelected && "border-(--system-accent) bg-(--system-accent)/5",
                  !showResult && isPaired && "border-muted-foreground/30 bg-muted/30",
                  !showResult && !isPaired && !isSelected && "border-border hover:bg-muted/50",
                )}
              >
                {item}
              </button>
            );
          })}
        </div>
        <div className="flex flex-col gap-2">
          <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
            Matches
          </span>
          {rightItems.map((item, idx) => {
            const isTaken = [...userPairs.values()].includes(idx);
            return (
              <button
                key={`right-${item}`}
                type="button"
                disabled={showResult || isTaken}
                aria-label={`Match target: ${item}`}
                onClick={() => onRightClick(idx)}
                className={cn(
                  "rounded-xl border px-3 py-2 text-left text-sm transition-colors",
                  showResult && "border-muted-foreground/30",
                  !showResult && isTaken && "border-muted-foreground/30 bg-muted/30 opacity-50",
                  !showResult && !isTaken && "border-border hover:bg-muted/50",
                )}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>
      {userPairs.size > 0 && !showResult && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
            Your pairs:
          </span>
          {[...userPairs.entries()].map(([li, ri]) => (
            <Badge key={li} variant="secondary" className="gap-1 rounded-full text-xs">
              {leftItems[li]} ↔ {rightItems[ri]}
              <button
                type="button"
                onClick={() => onRemovePair(li)}
                className="ml-0.5 text-muted-foreground hover:text-foreground"
                aria-label={`Remove pair ${leftItems[li]} ↔ ${rightItems[ri]}`}
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
