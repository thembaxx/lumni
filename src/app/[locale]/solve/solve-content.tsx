"use client";

import { useSearchParams } from "next/navigation";
import { AiSolver } from "@/components/tools/communication/ai-solver";

export function SolveContent() {
  const searchParams = useSearchParams();
  const initialQuestion = searchParams.get("question") ?? undefined;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="ios-title-1 font-semibold text-foreground tracking-tight">AI Solver</h1>
        <p className="ios-subhead mt-1.5 text-muted-foreground/60">
          Snap a photo of your homework or type a question to get step-by-step help.
        </p>
      </div>
      <div className="overflow-hidden rounded-card border border-border bg-card shadow-level-2">
        <AiSolver initialQuestion={initialQuestion} />
      </div>
    </div>
  );
}
