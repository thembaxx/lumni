"use client";

import { useCallback, useEffect, useState } from "react";
import type { GradingResult } from "@/lib/question-engine/types";
import { logError } from "@/lib/shared/logger";
import { useAuth } from "@/lib/auth/auth-context";
import { dexieDataAccess } from "@/lib/db";
import type { EssayDraftRecord } from "@/lib/db/types";

const MAX_REVISIONS = 3;

export interface EssayDraft {
  draftNumber: number;
  content: string;
  feedback: string;
  score: number;
  maxScore: number;
}

function toRecord(draft: EssayDraft, userId: string, questionId: string): EssayDraftRecord {
  return {
    userId,
    questionId,
    draftNumber: draft.draftNumber,
    content: draft.content,
    aiFeedback: draft.feedback,
    score: draft.score,
    maxScore: draft.maxScore,
    createdAt: Date.now(),
  };
}

function toDraft(record: EssayDraftRecord): EssayDraft {
  return {
    draftNumber: record.draftNumber,
    content: record.content,
    feedback: record.aiFeedback,
    score: record.score,
    maxScore: record.maxScore,
  };
}

export function useEssayCoaching(questionId: string) {
  const { user } = useAuth();
  const userId = user?.$id ?? "anonymous";

  const [drafts, setDrafts] = useState<EssayDraft[]>([]);
  const [isCoaching, setIsCoaching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentDraft, setCurrentDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const revisionCount = drafts.length;
  const canRevise = revisionCount < MAX_REVISIONS;

  useEffect(() => {
    dexieDataAccess.essayDrafts
      .where("questionId")
      .equals(questionId)
      .toArray()
      .then((records) => {
        records.sort((a, b) => a.draftNumber - b.draftNumber);
        setDrafts(records.map(toDraft));
      })
      .catch((e) => logError("EssayCoaching.loadDrafts", e));
  }, [questionId]);

  const startCoaching = useCallback(
    (initialDraft: string, initialResult: GradingResult) => {
      const draft: EssayDraft = {
        draftNumber: 1,
        content: initialDraft,
        feedback: initialResult.feedback,
        score: initialResult.score,
        maxScore: initialResult.maxScore,
      };

      setDrafts([draft]);
      setCurrentDraft(initialDraft);
      setIsCoaching(true);

      dexieDataAccess.essayDrafts
        .add(toRecord(draft, userId, questionId))
        .catch((e) => logError("EssayCoaching.startCoaching", e));
    },
    [questionId, userId],
  );

  const submitRevision = useCallback(
    async (draftContent: string) => {
      if (!canRevise) return;
      setIsSubmitting(true);
      setError(null);

      try {
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

        dexieDataAccess.essayDrafts
          .add(toRecord(newDraft, userId, questionId))
          .catch((e) => logError("EssayCoaching.submitRevision", e));
      } catch (err) {
        logError("EssayCoaching.submitRevision", err);
        setError("Failed to submit revision. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [questionId, drafts, canRevise, revisionCount, userId],
  );

  const lastResult = drafts.length > 0 ? drafts[drafts.length - 1] : null;
  const improvement =
    drafts.length >= 2 ? drafts[drafts.length - 1].score - drafts[drafts.length - 2].score : 0;

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
