"use client";

import BookOpen02Icon from "@hugeicons/core-free-icons/BookOpen02Icon";
import CheckmarkCircle01Icon from "@hugeicons/core-free-icons/CheckmarkCircle01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Button } from "@/components/ui/button";
import { DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export type SnapPhase =
  | "idle"
  | "capturing"
  | "extracting"
  | "confirm"
  | "solving"
  | "solved"
  | "error";

export interface SolveResult {
  solution: string;
  steps: string[];
  provider: string;
}

export function SnapDialog({
  phase,
  error,
  imagePreview,
  solveResult,
  extractedText,
  setExtractedText,
  flashcardCreated,
  creatingFlashcard,
  isOnQuizOrFlashcards,
  onSolveInline,
  onOpenSolver,
  onCreateFlashcard,
  onFillAnswer,
  onDismiss,
}: {
  phase: SnapPhase;
  error: string | null;
  imagePreview: string | null;
  solveResult: SolveResult | null;
  extractedText: string;
  setExtractedText: (v: string) => void;
  flashcardCreated: boolean;
  creatingFlashcard: boolean;
  isOnQuizOrFlashcards: boolean;
  onSolveInline: () => void;
  onOpenSolver: () => void;
  onCreateFlashcard: () => void;
  onFillAnswer: () => void;
  onDismiss: () => void;
}) {
  return (
    <DialogContent className="max-h-[80dvh] overflow-y-auto sm:max-w-lg">
      <DialogTitle className="ios-title-3 text-[--system-text-primary]">
        {phase === "extracting" && "Reading problem…"}
        {phase === "confirm" && "Verify extracted problem"}
        {phase === "solving" && "Solving…"}
        {phase === "solved" && "Solution"}
        {phase === "error" && "Something went wrong"}
        {phase === "capturing" && "Processing image…"}
      </DialogTitle>

      <div className="flex flex-col gap-4 py-2">
        {imagePreview && phase !== "capturing" && phase !== "solving" && (
          <div className="overflow-hidden rounded-xl border border-border">
            <Image
              src={imagePreview}
              alt="Captured problem"
              width={500}
              height={300}
              className="max-h-48 w-full object-contain"
              unoptimized
            />
          </div>
        )}

        {(phase === "capturing" || phase === "extracting" || phase === "solving") && (
          <div className="flex items-center justify-center gap-3 py-8">
            <div className="size-6 animate-spin rounded-full border-2 border-[--system-accent] border-t-transparent" />
            <span className="text-[--system-text-secondary] text-sm">
              {phase === "capturing" && "Processing image…"}
              {phase === "extracting" && "Reading problem from image…"}
              {phase === "solving" && "Solving…"}
            </span>
          </div>
        )}

        {phase === "confirm" && (
          <Textarea
            value={extractedText}
            onChange={(e) => setExtractedText(e.target.value)}
            className="min-h-30 rounded-xl bg-system-surface px-4 py-3"
            placeholder="Edit the extracted problem if needed…"
          />
        )}

        {phase === "solved" && solveResult && (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <MarkdownRenderer content={solveResult.solution} subject="mathematics" />
            </div>
            {solveResult.steps.length > 0 && (
              <div className="flex flex-col gap-2">
                <h4 className="font-medium text-muted-foreground text-sm">Steps</h4>
                {solveResult.steps.map((step, i) => (
                  <div
                    key={`st-${step.slice(0, 40).replace(/\s+/g, "-")}`}
                    data-index={i}
                    className="rounded-lg border border-border/60 bg-muted/30 p-3"
                  >
                    <span className="mr-2 font-mono text-muted-foreground text-xs">{i + 1}.</span>
                    <MarkdownRenderer content={step} subject="mathematics" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {phase === "error" && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="outline" onClick={onDismiss} className="flex-1">
            {phase === "solved" ? "Close" : "Cancel"}
          </Button>
          {phase === "solved" && (
            <Button
              variant="secondary"
              onClick={onCreateFlashcard}
              disabled={creatingFlashcard || flashcardCreated}
              className="flex-1 gap-1.5"
            >
              <HugeiconsIcon
                icon={flashcardCreated ? CheckmarkCircle01Icon : BookOpen02Icon}
                className="size-4"
              />
              {creatingFlashcard
                ? "Creating…"
                : flashcardCreated
                  ? "Flashcard Created"
                  : "Create Flashcard"}
            </Button>
          )}
          {phase === "confirm" && (
            <>
              {isOnQuizOrFlashcards && (
                <Button onClick={onFillAnswer} variant="default" className="flex-1">
                  Use as Answer
                </Button>
              )}
              <Button
                onClick={onSolveInline}
                variant={isOnQuizOrFlashcards ? "outline" : "default"}
                className="flex-1"
              >
                Solve Here
              </Button>
              <Button onClick={onOpenSolver} variant="outline" className="flex-1">
                Open Solver
              </Button>
            </>
          )}
          {phase === "error" && (
            <Button variant="default" onClick={onDismiss} className="flex-1">
              Type Instead
            </Button>
          )}
        </div>
      </div>
    </DialogContent>
  );
}
