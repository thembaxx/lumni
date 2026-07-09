"use client";

import * as m from "motion/react-m";
import { useState } from "react";
import { BoltCelebration } from "@/components/dashboard/bolt-celebration";
import { Button } from "@/components/ui/button";

interface BoltBranchV2Props {
  correct: boolean;
  subjectLabel: string;
  streak: number;
  onContinue: () => void;
  onPracticeMore?: () => void;
  onSeeResults: () => void;
}

export function BoltBranchV2({
  correct,
  subjectLabel,
  streak,
  onContinue,
  onPracticeMore,
  onSeeResults,
}: BoltBranchV2Props) {
  const [step, setStep] = useState<"branch" | "celebration">("branch");

  if (step === "celebration") {
    return (
      <BoltCelebration
        correct={correct}
        subjectLabel={subjectLabel}
        streak={streak}
        onContinue={onContinue}
      />
    );
  }

  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-1 flex-col items-center justify-center gap-6 py-8"
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h2 className="ios-title-2 font-bold text-foreground tracking-tight">
          {correct ? "Great job!" : "Keep practicing"}
        </h2>
        <p className="text-muted-foreground text-sm">{subjectLabel}</p>
      </div>

      <div className="flex flex-col gap-3">
        {onPracticeMore && (
          <Button
            onClick={onPracticeMore}
            variant="outline"
            size="lg"
            className="min-h-12 gap-2 px-8 text-base"
          >
            Practice more
          </Button>
        )}
        <Button
          onClick={() => {
            onSeeResults();
            setStep("celebration");
          }}
          size="lg"
          className="min-h-12 gap-2 px-8 text-base"
        >
          See results
        </Button>
      </div>
    </m.div>
  );
}
