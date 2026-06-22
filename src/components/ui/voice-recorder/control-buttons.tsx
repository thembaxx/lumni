"use client";

import Mic01Icon from "@hugeicons/core-free-icons/Mic01Icon";
import MicOff01Icon from "@hugeicons/core-free-icons/MicOff01Icon";
import PauseIcon from "@hugeicons/core-free-icons/PauseIcon";
import PlayIcon from "@hugeicons/core-free-icons/PlayIcon";
import UndoIcon from "@hugeicons/core-free-icons/UndoIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ControlButtonsProps {
  recorderState: "idle" | "recording" | "recorded" | "playing" | "sending" | "permission-denied";
  audioBlob: Blob | null;
  disabled: boolean;
  onReset: () => void;
  onRecordClick: () => void;
  onTogglePlayback: () => void;
}

export function ControlButtons({
  recorderState,
  audioBlob,
  disabled,
  onReset,
  onRecordClick,
  onTogglePlayback,
}: ControlButtonsProps) {
  const isRecording = recorderState === "recording";
  const isPlaying = recorderState === "playing";
  const isPaperPlaneing = recorderState === "sending";
  const showPermissionError = recorderState === "permission-denied";
  return (
    <div className="flex items-center gap-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={onReset}
        disabled={(!audioBlob && !isRecording) || isPaperPlaneing}
        className={cn(
          "rounded-lg",
          audioBlob || isRecording
            ? "bg-muted/80 text-muted-foreground hover:scale-105 hover:bg-muted hover:text-foreground"
            : "bg-muted/30 text-muted-foreground/30",
          isPaperPlaneing && "pointer-events-none opacity-50",
        )}
        aria-label="Reset recording"
      >
        <span className="transition-transform duration-200 active:rotate-180">
          <HugeiconsIcon icon={UndoIcon} className="size-4" />
        </span>
      </Button>

      <Button
        variant="ghost"
        onClick={onRecordClick}
        disabled={disabled || showPermissionError}
        className={cn(
          "relative h-16 w-16 rounded-full",
          isRecording
            ? "bg-destructive text-destructive-foreground shadow-level-2"
            : showPermissionError
              ? "cursor-not-allowed bg-muted text-muted-foreground"
              : "bg-foreground text-background hover:scale-105 hover:shadow-foreground/20 hover:shadow-level-2",
          isPaperPlaneing && "pointer-events-none opacity-50",
        )}
        aria-label={isRecording ? "Stop recording" : "Start recording"}
      >
        <span
          className={cn(
            "absolute inset-0 rounded-full transition-opacity duration-300",
            isRecording ? "animate-ping bg-destructive/40" : "ring-2 ring-transparent",
          )}
        />
        <span className="relative flex items-center justify-center">
          <HugeiconsIcon
            icon={MicOff01Icon}
            className="absolute size-6 transition-[opacity,transform] duration-200"
            style={{
              opacity: isRecording ? 1 : 0,
              transform: `scale(${isRecording ? 1 : 0.25})`,
              transitionTimingFunction: "cubic-bezier(0.2, 0, 0, 1)",
            }}
          />
          <HugeiconsIcon
            icon={Mic01Icon}
            className="size-6 transition-[opacity,transform] duration-200"
            style={{
              opacity: isRecording ? 0 : 1,
              transform: `scale(${isRecording ? 0.25 : 1})`,
              transitionTimingFunction: "cubic-bezier(0.2, 0, 0, 1)",
            }}
          />
        </span>
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={onTogglePlayback}
        disabled={!audioBlob || isRecording || isPaperPlaneing}
        className={cn(
          "rounded-lg",
          audioBlob && !isRecording
            ? "bg-[--system-accent] text-background hover:scale-105 hover:shadow-level-2"
            : "bg-muted/30 text-muted-foreground/30",
          isPaperPlaneing && "pointer-events-none opacity-50",
        )}
        aria-label={isPlaying ? "Pause playback" : "Play recording"}
      >
        <span className="relative flex items-center justify-center">
          <HugeiconsIcon
            icon={PauseIcon}
            className="absolute size-4 transition-[opacity,transform] duration-200"
            style={{
              opacity: isPlaying ? 1 : 0,
              transform: `scale(${isPlaying ? 1 : 0.25})`,
              transitionTimingFunction: "cubic-bezier(0.2, 0, 0, 1)",
            }}
          />
          <HugeiconsIcon
            icon={PlayIcon}
            className="ml-0.5 size-4 transition-[opacity,transform] duration-200"
            style={{
              opacity: isPlaying ? 0 : 1,
              transform: `scale(${isPlaying ? 0.25 : 1})`,
              transitionTimingFunction: "cubic-bezier(0.2, 0, 0, 1)",
            }}
          />
        </span>
      </Button>
    </div>
  );
}
