"use client";

import StarIcon from "@hugeicons/core-free-icons/StarIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { VerifiedByPill } from "@/components/tools/communication/verified-by-pill";
import { Badge } from "@/components/ui/badge";
import { PageContainer } from "@/components/layout/page-container";
import { Skeleton } from "@/components/ui/skeleton";
import type { Question } from "@/lib/question-engine/types";
import { logError } from "@/lib/shared/logger";
import { cn } from "@/lib/utils";

interface FetchedData {
  id: string;
  question: Question;
  subject: string;
  topic: string;
  sharedAt: number;
  sources?: { url: string; title: string }[];
}

const RATING_KEY = "lumni_question_ratings";

function getStoredRating(id: string): number {
  try {
    const raw = localStorage.getItem(RATING_KEY);
    if (!raw) return 0;
    const ratings = JSON.parse(raw) as Record<string, number>;
    return ratings[id] ?? 0;
  } catch {
    return 0;
  }
}

function storeRating(id: string, rating: number): void {
  try {
    const raw = localStorage.getItem(RATING_KEY);
    const ratings = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    ratings[id] = rating;
    localStorage.setItem(RATING_KEY, JSON.stringify(ratings));
  } catch (e) {
    logError("SharePageView", e);
  }
}

export function SharedQuestionClient() {
  const { id } = useParams<{ id: string }>();
  const questionId = id;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["shared-question", questionId],
    queryFn: async () => {
      const res = await fetch(`/api/q/${questionId}`);
      if (!res.ok) throw new Error("not found");
      return res.json() as Promise<FetchedData>;
    },
    enabled: !!questionId,
  });

  const storedRating = questionId ? getStoredRating(questionId) : 0;
  const [rating, setRating] = useState(storedRating);
  const [submittedRating, setSubmittedRating] = useState(storedRating);
  const [showAnswer, setShowAnswer] = useState(storedRating >= 3);

  const handleRate = useCallback(
    (value: number) => {
      setRating(value);
      if (questionId) {
        storeRating(questionId, value);
        setSubmittedRating(value);
        if (value >= 3) {
          setShowAnswer(true);
        }
      }
    },
    [questionId],
  );

  const isUnlocked = useMemo(
    () => showAnswer || submittedRating >= 3,
    [showAnswer, submittedRating],
  );

  if (isLoading) {
    return (
      <PageContainer className="min-h-dvh gap-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </PageContainer>
    );
  }

  if (isError || !data) {
    return (
      <PageContainer className="min-h-dvh items-center justify-center gap-4 py-8 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
          <span className="text-2xl">?</span>
        </div>
        <h1 className="font-bold font-heading text-2xl">Question Not Found</h1>
        <p className="max-w-md text-muted-foreground text-sm">
          This question may have been removed or the link is invalid.
        </p>
        <Link
          href="/dashboard"
          className="mt-2 inline-flex rounded-xl bg-primary px-5 py-2.5 font-medium text-primary-foreground text-sm"
        >
          Go to Dashboard
        </Link>
      </PageContainer>
    );
  }

  const q = data.question;

  return (
    <PageContainer className="min-h-dvh gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{data.subject}</Badge>
          {q.topic && (
            <Badge variant="outline" className="text-xs">
              {q.topic}
            </Badge>
          )}
          <Badge
            variant="outline"
            className={cn(
              "text-xs",
              q.difficulty === "Easy" && "text-success",
              q.difficulty === "Medium" && "text-warning",
              q.difficulty === "Hard" && "text-destructive",
            )}
          >
            {q.difficulty}
          </Badge>
        </div>
        <h1 className="font-bold text-2xl tracking-tight">Shared Question</h1>
      </div>

      <div className="rounded-xl border bg-card p-5">
        <MarkdownRenderer content={q.questionText} subject={data.subject} />
      </div>

      {!isUnlocked && (
        <div className="flex flex-col items-center gap-4 rounded-xl border bg-muted/20 p-6 text-center">
          <p className="font-medium text-sm">Rate this question to reveal the answer</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => handleRate(star)}
                className={cn(
                  "size-8 rounded-lg p-1 transition-colors",
                  star <= rating ? "text-(--system-warning)" : "text-muted-foreground/30",
                )}
                aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
              >
                <HugeiconsIcon icon={StarIcon} className="size-full" />
              </button>
            ))}
          </div>
        </div>
      )}

      {isUnlocked && (
        <>
          {q.explanation && (
            <div className="rounded-xl border bg-card p-5">
              <h2 className="mb-3 font-semibold text-sm">Explanation</h2>
              <MarkdownRenderer content={q.explanation} subject={data.subject} />
            </div>
          )}

          {q.steps && q.steps.length > 0 && (
            <div className="rounded-xl border bg-card p-5">
              <h2 className="mb-3 font-semibold text-sm">Steps</h2>
              <ol className="flex list-inside list-decimal flex-col gap-2 text-sm">
                {q.steps.map((step) => (
                  <li key={step.substring(0, 32)}>
                    <MarkdownRenderer content={step} subject={data.subject} />
                  </li>
                ))}
              </ol>
            </div>
          )}

          {data.sources && data.sources.length > 0 && <VerifiedByPill sources={data.sources} />}

          <div className="flex items-center justify-between gap-4 rounded-xl border bg-muted/20 p-4">
            <p className="text-muted-foreground text-xs">Was this helpful?</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRate(star)}
                  className={cn(
                    "size-6 rounded p-0.5 transition-colors",
                    star <= rating ? "text-(--system-warning)" : "text-muted-foreground/20",
                  )}
                  aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
                >
                  <HugeiconsIcon icon={StarIcon} className="size-full" />
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </PageContainer>
  );
}
