"use client";

import FlashIcon from "@hugeicons/core-free-icons/FlashIcon";
import PlayFreeIcons from "@hugeicons/core-free-icons/PlayIcon";
import Timer01Icon from "@hugeicons/core-free-icons/Timer01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SubjectSelect } from "@/components/ui/subject-select";
import { useQuizSession } from "@/hooks/use-quiz-session";
import { formatTime } from "@/lib/shared/time";

interface QuizStartCardProps {
  onStart: (subject: string) => void;
}

export function QuizStartCard({ onStart }: QuizStartCardProps) {
  const [selectedSubject, setSelectedSubject] = useState("");
  const { state } = useQuizSession({ enabled: false });

  const handleStart = () => {
    if (selectedSubject) onStart(selectedSubject);
  };

  return (
    <Card className="overflow-visible rounded-card border-system-accent/20 bg-system-accent/5 shadow-level-1">
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg tracking-tight">Start a Quiz</h3>
          <div className="flex items-center gap-3 rounded-full border border-muted bg-muted/30 px-3 py-1.5">
            <div className="flex items-center gap-1.5">
              <HugeiconsIcon icon={Timer01Icon} className="size-3.5 text-muted-foreground" />
              <span className="font-medium font-mono text-muted-foreground text-xs tabular-nums tracking-tight">
                {formatTime(state.elapsedTime)}
              </span>
            </div>
            <div className="h-3 w-px bg-muted" />
            <div className="flex items-center gap-1.5">
              <HugeiconsIcon icon={FlashIcon} className="size-3.5 text-warning" />
              <span className="font-mono font-semibold text-muted-foreground text-xs tabular-nums">
                {state.points || 0}
              </span>
            </div>
          </div>
        </div>

        <SubjectSelect
          value={selectedSubject}
          onChange={setSelectedSubject}
          placeholder="Choose a subject to practice"
        />

        <div className="flex items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm">
            {selectedSubject ? "Ready to test your knowledge?" : "Pick a subject above to begin"}
          </p>
          <Button
            size="sm"
            onClick={handleStart}
            disabled={!selectedSubject}
            className="gap-2 rounded-full bg-system-accent px-6 text-system-accent-foreground shadow-level-1 hover:bg-system-accent/90 hover:shadow-level-2 disabled:cursor-not-allowed disabled:opacity-50 press-scale"
          >
            <HugeiconsIcon icon={PlayFreeIcons} data-icon="inline-start" />
            Start
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
