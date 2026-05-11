"use client";

import { Clock, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExamHeaderProps {
  subject: string;
  paperCode: string;
  timeRemaining: number;
  answeredCount: number;
  totalParts: number;
  totalMarks: number;
  onToggleSidebar: () => void;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

export function ExamHeader({
  subject,
  paperCode,
  timeRemaining,
  answeredCount,
  totalParts,
  totalMarks,
  onToggleSidebar,
}: ExamHeaderProps) {
  const isLowTime = timeRemaining < 300;

  return (
    <header className="flex items-center gap-3 px-4 py-2.5 border-b bg-background shrink-0">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 lg:hidden"
        onClick={onToggleSidebar}
      >
        <Menu className="w-4 h-4" />
      </Button>

      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm font-semibold truncate">
          {subject} {paperCode}
        </span>
      </div>

      <div className="flex items-center gap-4 ml-auto text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">Progress:</span>
          <span className="font-medium">
            {answeredCount}/{totalParts}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">Marks:</span>
          <span className="font-medium">{totalMarks}</span>
        </div>
        <div
          className={`flex items-center gap-1.5 ${
            isLowTime ? "text-destructive" : "text-muted-foreground"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span
            className={`font-mono font-medium ${
              isLowTime ? "animate-pulse" : ""
            }`}
          >
            {formatTime(timeRemaining)}
          </span>
        </div>
      </div>
    </header>
  );
}
