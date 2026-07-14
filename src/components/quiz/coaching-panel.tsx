"use client";

import SparklesIcon from "@hugeicons/core-free-icons/SparklesIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import * as m from "motion/react-m";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { iOSEase } from "@/lib/utils/animation";
import { useEssayCoaching } from "@/hooks/use-essay-coaching";

interface CoachingPanelProps {
  questionId: string;
  questionType: string;
  initialDraft: string;
  initialResult: {
    correct: boolean;
    score: number;
    feedback: string;
  } | null;
}

export function CoachingPanel({
  questionId,
  questionType,
  initialDraft,
  initialResult,
}: CoachingPanelProps) {
  const coaching = useEssayCoaching(questionId);

  if (questionType !== "essay") return null;
  if (!initialResult) return null;

  if (coaching.isCoaching) {
    return (
      <m.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: iOSEase }}
        className="flex flex-col gap-3 rounded-lg border border-border/50 bg-card p-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Essay Coach</h3>
          <span className="text-muted-foreground text-xs">
            Revision {coaching.revisionCount} of {coaching.maxRevisions}
          </span>
        </div>

        {coaching.lastResult && coaching.revisionCount > 1 && (
          <div className="flex flex-wrap gap-2 text-xs">
            {coaching.improvement !== 0 && (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 font-medium",
                  coaching.improvement > 0
                    ? "bg-success/15 text-success"
                    : "bg-destructive/15 text-destructive",
                )}
              >
                {coaching.improvement > 0 ? "+" : ""}
                {coaching.improvement} pts
              </span>
            )}
            <span className="text-muted-foreground">
              Score: {coaching.lastResult.score}/{coaching.lastResult.maxScore}
            </span>
          </div>
        )}

        {coaching.lastResult && (
          <div className="rounded-lg bg-muted/30 p-3 text-sm">{coaching.lastResult.feedback}</div>
        )}

        {coaching.canRevise && (
          <div className="flex flex-col gap-2">
            <Textarea
              value={coaching.currentDraft}
              onChange={(e) => coaching.setCurrentDraft(e.target.value)}
              rows={4}
              aria-label="Revised essay draft"
              className="min-h-20 resize-y text-sm"
            />
            <Button
              onClick={() => coaching.submitRevision(coaching.currentDraft)}
              disabled={coaching.isSubmitting || !coaching.currentDraft.trim()}
              size="sm"
              className="self-end rounded-full"
            >
              {coaching.isSubmitting ? "Submitting..." : "Submit Revision"}
            </Button>
          </div>
        )}

        {coaching.error && <p className="text-destructive text-xs">{coaching.error}</p>}

        {!coaching.canRevise && (
          <p className="text-center text-muted-foreground text-xs">
            Great work! You have made {coaching.maxRevisions} revisions — time to move on.
          </p>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={coaching.stopCoaching}
          className="self-start text-xs"
        >
          Close Coach
        </Button>
      </m.div>
    );
  }

  if (coaching.revisionCount === 0) {
    return (
      <div className="flex">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            coaching.startCoaching(initialDraft, {
              correct: initialResult.correct,
              score: initialResult.score,
              maxScore: -1,
              feedback: initialResult.feedback,
            })
          }
          className="gap-2 rounded-full text-xs"
        >
          <HugeiconsIcon icon={SparklesIcon} className="size-4" />
          Get Coaching
        </Button>
      </div>
    );
  }

  return null;
}
