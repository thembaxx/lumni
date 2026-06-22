"use client";

import Clock01Icon from "@hugeicons/core-free-icons/Clock01Icon";
import UndoIcon from "@hugeicons/core-free-icons/UndoIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import type { AngleMode } from "@/lib/calculator/engine";

interface CalculatorToolbarProps {
  angleMode: AngleMode;
  onToggleAngle: () => void;
  onToggleHistory: () => void;
  onClearHistory: () => void;
}

export function CalculatorToolbar({
  angleMode,
  onToggleAngle,
  onToggleHistory,
  onClearHistory,
}: CalculatorToolbarProps) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <Button
          variant={angleMode === "deg" ? "default" : "ghost"}
          size="xs"
          onClick={onToggleAngle}
          className="h-7 rounded-lg px-2.5 font-mono text-xs"
        >
          DEG
        </Button>
        <Button
          variant={angleMode === "rad" ? "default" : "ghost"}
          size="xs"
          onClick={onToggleAngle}
          className="h-7 rounded-lg px-2.5 font-mono text-xs"
        >
          RAD
        </Button>
      </div>
      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="xs"
          onClick={onToggleHistory}
          className="h-7 rounded-lg px-2.5 text-xs"
          aria-label="Toggle history"
        >
          <HugeiconsIcon icon={UndoIcon} className="size-3.5" data-icon />
        </Button>
        <Button
          variant="ghost"
          size="xs"
          onClick={onClearHistory}
          className="h-7 rounded-lg px-2.5 text-xs"
          aria-label="Clear history"
        >
          <HugeiconsIcon icon={Clock01Icon} className="size-3.5" data-icon />
        </Button>
      </div>
    </div>
  );
}
