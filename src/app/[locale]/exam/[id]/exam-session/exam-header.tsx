"use client";

import ArrowLeft01Icon from "@hugeicons/core-free-icons/ArrowLeft01Icon";
import Clock01Icon from "@hugeicons/core-free-icons/Clock01Icon";
import Pause from "@hugeicons/core-free-icons/PauseIcon";
import PlayFreeIcons from "@hugeicons/core-free-icons/PlayIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/shared/time";
import { cn } from "@/lib/utils";

interface ExamHeaderProps {
  paperCode?: string;
  sessionMode: "timed" | "practice" | "mock";
  answeredCount: number;
  totalPartsCount: number;
  currentPartIndex: number;
  timeRemaining: number;
  paused: boolean;
  onBack: () => void;
  onTogglePause: () => void;
  onTogglePalette: () => void;
  onSubmit: () => void;
}

export function ExamHeader({
  paperCode,
  sessionMode,
  answeredCount,
  totalPartsCount,
  currentPartIndex,
  timeRemaining,
  paused,
  onBack,
  onTogglePause,
  onTogglePalette,
  onSubmit,
}: ExamHeaderProps) {
  const t = useTranslations();
  const isMock = sessionMode === "mock";

  return (
    <header className="sticky top-0 z-sticky border-border border-b bg-system-background/95">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="-ml-2 rounded-xl p-2 transition-colors hover:bg-muted"
            aria-label="Go back"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-5" />
          </button>
          <div>
            <p className="font-semibold text-sm">{paperCode}</p>
            <p className="text-muted-foreground text-xs">
              {isMock
                ? t("exam.mockExam")
                : sessionMode === "timed"
                  ? t("exam.timed")
                  : t("exam.practice")}{" "}
              · {answeredCount}/{totalPartsCount}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {(sessionMode === "timed" || isMock) && (
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={Clock01Icon} className="size-4" />
              <span
                className={cn(
                  "font-mono text-sm tabular-nums",
                  timeRemaining < 300 && "text-destructive",
                )}
              >
                {formatTime(timeRemaining)}
              </span>
            </div>
          )}

          {sessionMode === "practice" && (
            <button
              type="button"
              onClick={onTogglePause}
              className="rounded-xl p-2 transition-colors hover:bg-muted"
              aria-label={paused ? "Resume timer" : "Pause timer"}
            >
              {paused ? (
                <HugeiconsIcon icon={PlayFreeIcons} className="size-5" />
              ) : (
                <HugeiconsIcon icon={Pause} className="size-5" />
              )}
            </button>
          )}

          {!isMock && (
            <button
              type="button"
              onClick={onTogglePalette}
              className="relative rounded-xl p-2 transition-colors hover:bg-muted"
            >
              <span className="font-mono text-sm tabular-nums">
                {currentPartIndex + 1}/{totalPartsCount}
              </span>
            </button>
          )}

          <Button size="sm" onClick={onSubmit}>
            {t("exam.submitExam")}
          </Button>
        </div>
      </div>
    </header>
  );
}
