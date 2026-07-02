"use client";

import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon";
import CheckmarkCircle01Icon from "@hugeicons/core-free-icons/CheckmarkCircle01Icon";
import FireIcon from "@hugeicons/core-free-icons/FireIcon";
import SparklesIcon from "@hugeicons/core-free-icons/SparklesIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import { XP_PER_CORRECT, XP_PER_QUESTION, XP_STREAK_BONUS } from "@/types/gamification";

interface BoltCelebrationProps {
  correct: boolean;
  subjectLabel: string;
  streak: number;
  onContinue: () => void;
}

export function BoltCelebration({
  correct,
  subjectLabel,
  streak,
  onContinue,
}: BoltCelebrationProps) {
  const baseXp = XP_PER_QUESTION + (correct ? XP_PER_CORRECT : 0);
  const showStreakBonus = streak > 1;
  const totalXp = baseXp + (showStreakBonus ? XP_STREAK_BONUS : 0);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 py-8">
      <div className="flex flex-col items-center gap-5 text-center">
        <div className="animate-materialize motion-reduce:animate-none motion-reduce:transition-none">
          <div
            className={
              correct
                ? "relative flex size-24 items-center justify-center rounded-3xl bg-success/15 ring-1 ring-success/25"
                : "relative flex size-24 items-center justify-center rounded-3xl bg-destructive/10 ring-1 ring-destructive/20"
            }
          >
            <div
              className={
                correct
                  ? "absolute inset-0 rounded-3xl bg-success/20 blur-xl"
                  : "absolute inset-0 rounded-3xl bg-destructive/20 blur-xl"
              }
            />
            <div className="animate-bounce-pop" style={{ animationDelay: "0.15s" }}>
              <HugeiconsIcon
                icon={correct ? CheckmarkCircle01Icon : Cancel01Icon}
                className={
                  correct ? "relative size-12 text-success" : "relative size-12 text-destructive"
                }
                strokeWidth={2.25}
              />
            </div>
          </div>
        </div>

        <div
          className="animate-materialize flex flex-col gap-1.5"
          style={{ animationDelay: "0.12s" }}
        >
          <h2 className="ios-title-2 text-balance font-extrabold text-foreground tracking-tight">
            {correct ? "Correct!" : "Not quite"}
          </h2>
          <p className="text-balance text-muted-foreground text-sm">{subjectLabel}</p>
        </div>

        <div
          className="animate-bounce-pop flex items-center gap-3"
          style={{ animationDelay: "0.28s" }}
        >
          <div className="flex items-center gap-1.5 rounded-full bg-system-fill px-4 py-2">
            <HugeiconsIcon icon={SparklesIcon} className="size-5 text-warning" strokeWidth={2} />
            <span className="font-semibold tabular-nums">+{totalXp} XP</span>
          </div>
          {showStreakBonus && (
            <div className="flex items-center gap-1.5 rounded-full bg-warning/10 px-4 py-2">
              <HugeiconsIcon
                icon={FireIcon}
                className="size-5 text-warning animate-float-bob"
                strokeWidth={2}
              />
              <span className="font-semibold tabular-nums">{streak}-day streak</span>
            </div>
          )}
        </div>
      </div>

      <div
        className="animate-materialize flex flex-col items-center gap-2.5"
        style={{ animationDelay: "0.42s" }}
      >
        <Button
          onClick={onContinue}
          size="lg"
          className="min-h-[56px] gap-2 px-10 text-base press-scale"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
