"use client";

import Target01Icon from "@hugeicons/core-free-icons/Target01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { TimerDisplay } from "@/components/shared/timer-display";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface AssessmentHeaderProps {
  title: string;
  elapsedTime: number;
  currentQuestionIndex: number;
  totalQuestions: number;
  progressValue: number;
  onQuit?: () => void;
  showAccuracy?: boolean;
  accuracy?: number;
  difficulty?: "easy" | "medium" | "hard";
  showMarks?: boolean;
  marks?: number;
  totalMarks?: number;
  showProgress?: boolean;
  timeRemaining?: number;
  formatTime?: (seconds: number) => string;
  className?: string;
}

const difficultyColors = {
  easy: "bg-success/20 text-success-foreground dark:text-success-foreground border-success/30",
  medium: "bg-warning/20 text-warning-foreground dark:text-warning-foreground border-warning/30",
  hard: "bg-destructive/20 text-destructive-foreground dark:text-destructive-foreground border-destructive/30",
};

export function AssessmentHeader({
  title: _title,
  elapsedTime,
  currentQuestionIndex,
  totalQuestions,
  progressValue,
  onQuit,
  showAccuracy,
  accuracy,
  difficulty,
  showMarks,
  marks,
  totalMarks,
  showProgress = true,
  timeRemaining,
  formatTime,
  className,
}: AssessmentHeaderProps) {
  const isExam = timeRemaining !== undefined;
  const isUrgent = timeRemaining !== undefined && timeRemaining <= 10;

  return (
    <div className={cn("flex", "flex-col", "gap-4", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Left: Quit button */}
        {onQuit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onQuit}
            className="font-medium text-muted-foreground hover:bg-destructive/10 hover:text-foreground"
          >
            <span className="text-lg leading-none" aria-hidden="true">
              ×
            </span>
            <span className="ml-1">Quit</span>
          </Button>
        )}

        {/* Center: Timer01Icon + difficulty/accuracy + question counter */}
        <div className="flex flex-wrap items-center gap-2">
          <TimerDisplay
            elapsedTime={elapsedTime}
            variant="inline"
            showIcon={false}
            formatTimeFn={formatTime}
            urgent={isUrgent}
          />

          {isExam && timeRemaining !== undefined && (
            <>
              <span className="text-muted-foreground">·</span>
              <span className="font-mono text-muted-foreground text-sm">
                {typeof formatTime === "function"
                  ? formatTime(timeRemaining)
                  : `${Math.floor(timeRemaining / 60)}m ${timeRemaining % 60}s`}
              </span>
            </>
          )}

          <span className="text-muted-foreground">·</span>

          {difficulty && (
            <>
              <Badge
                variant="outline"
                className={cn("border font-mono text-xs", difficultyColors[difficulty])}
              >
                {difficulty}
              </Badge>
              <span className="text-muted-foreground">·</span>
            </>
          )}

          {showAccuracy && accuracy !== undefined && (
            <>
              <HugeiconsIcon icon={Target01Icon} className="size-3.5 text-muted-foreground" />
              <span className="font-semibold text-muted-foreground text-sm tabular-nums">
                {accuracy}%
              </span>
              <span className="text-muted-foreground">·</span>
            </>
          )}

          <span className="font-mono text-muted-foreground text-sm">
            {currentQuestionIndex + 1}/{totalQuestions}
          </span>
        </div>

        {/* Right: Marks display (exam context) */}
        {showMarks && marks !== undefined && totalMarks !== undefined && (
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground text-sm">Marks:</span>
            <span className="font-semibold text-muted-foreground text-sm tabular-nums">
              {marks}/{totalMarks}
            </span>
          </div>
        )}
      </div>

      {/* Optional progress bar */}
      {showProgress && <Progress value={progressValue} className="h-1.5" />}
    </div>
  );
}
