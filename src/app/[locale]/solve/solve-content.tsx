"use client";

import { useSearchParams } from "next/navigation";
import { AiSolver } from "@/components/tools/communication/ai-solver";
import { Reveal, SpotlightCard } from "@/components/shared/motion-primitives";

export function SolveContent() {
  const searchParams = useSearchParams();
  const initialQuestion = searchParams.get("question") ?? undefined;
  const cameraFocus = searchParams.has("camera");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="ios-title-1 font-semibold text-foreground tracking-tight">AI Solver</h1>
        <p className="ios-subhead mt-1.5 text-muted-foreground">
          Snap a photo of your homework or type a question to get step-by-step help.
        </p>
      </div>
      <Reveal y={18}>
        <SpotlightCard className="rounded-card" radius={420}>
          <div className="overflow-hidden rounded-card border border-border bg-card shadow-level-2">
            <AiSolver initialQuestion={initialQuestion} cameraFocus={cameraFocus} />
          </div>
        </SpotlightCard>
      </Reveal>
    </div>
  );
}
