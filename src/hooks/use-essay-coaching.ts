"use client";

import { useCallback, useState } from "react";
import type { GradingResult } from "@/lib/question-engine/types";
import { logError } from "@/lib/shared/logger";

const MAX_REVISIONS = 3;

export interface EssayDraft {
  draftNumber: number;
  content: string;
  feedback: string;
  score: number;
  maxScore: number;
}

export function useEssayCoaching(questionId: string) {
  const [drafts, setDrafts] = useState<EssayDraft[]>([]);
  const [isCoaching, setIsCoaching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentDraft, setCurrentDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const revisionCount = drafts.length;
  const canRevise = revisionCount < MAX_REVISIONS;

  const startCoaching = useCallback(
    (initialDraft: string, initialResult: GradingResult) => {
      setDrafts([
        {
          draftNumber: 1,
          content: initialDraft,
          feedback: initialResult.feedback,
          score: initialResult.score,
          maxScore: initialResult.maxScore,
        },
      ]);
      setCurrentDraft(initialDraft);
      setIsCoaching(true);
    },
    [],
  );

  const submitRevision = useCallback(
    async (draftContent: string) => {
      if (!canRevise) return;
      setIsSubmitting(true);
      setError(null);

      try {
        const prevDraft = drafts[drafts.length - 1];
        const res = await fetch("/api/engine/grade", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: { id: questionId },
            answer: { type: "text", value: draftContent },
            previousDrafts: drafts.map((d) => ({
              draftNumber: d.draftNumber,
              content: d.content,
              aiFeedback: d.feedback,
            })),
          }),
        });

        if (!res.ok) throw new Error("Failed to submit revision");
        const result: GradingResult = await res.json();

        const newDraft: EssayDraft = {
          draftNumber: revisionCount + 1,
          content: draftContent,
          feedback: result.feedback,
          score: result.score,
          maxScore: result.maxScore,
        };

        setDrafts((prev) => [...prev, newDraft]);
        setCurrentDraft(draftContent);
      } catch (err) {
        logError("EssayCoaching.submitRevision", err);
        setError("Failed to submit revision. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [questionId, drafts, canRevise, revisionCount],
  );

  const lastResult = drafts.length > 0 ? drafts[drafts.length - 1] : null;
  const improvement = drafts.length >= 2
    ? drafts[drafts.length - 1].score - drafts[drafts.length - 2].score
    : 0;

  return {
    drafts,
    isCoaching,
    isSubmitting,
    currentDraft,
    setCurrentDraft,
    error,
    revisionCount,
    maxRevisions: MAX_REVISIONS,
    canRevise,
    lastResult,
    improvement,
    startCoaching,
    submitRevision,
    stopCoaching: useCallback(() => setIsCoaching(false), []),
  };
}
