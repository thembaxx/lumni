"use client";

import AlertCircleIcon from "@hugeicons/core-free-icons/AlertCircleIcon";
import BookOpenIcon from "@hugeicons/core-free-icons/BookOpen01Icon";
import RefreshIcon from "@hugeicons/core-free-icons/RefreshIcon";
import SparklesIcon from "@hugeicons/core-free-icons/SparklesIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BoltCelebration } from "@/components/dashboard/bolt-celebration";
import { useImmersiveMode } from "@/components/shared/immersive-mode";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGamification } from "@/hooks/use-gamification";
import { useNavigationDirection } from "@/hooks/use-navigation-direction";
import { useQuestionEngine } from "@/hooks/use-question-engine";
import { useWrongAnswerJournal } from "@/hooks/use-wrong-answer-journal";
import { resolveWeakestSubject, formatSubjectLabel } from "@/lib/bolt/resolve-weakest";
import { flashcardEngine } from "@/lib/flashcard-engine";
import { enqueue } from "@/lib/orchestrator/job-queue";
import { trackQuestionResult } from "@/lib/orchestrator/track-result";
import { processQuizResult, type QuizResultDeps } from "@/lib/services/quiz-result-processor";
import { iOSDecelerate, iOSEase } from "@/lib/utils/animation";
import { cn } from "@/lib/utils";
import { QuestionCard } from "./question-card";

export function BoltQuiz() {
  const { push } = useNavigationDirection();
  const { setImmersive } = useImmersiveMode();
  const {
    addXp,
    updateStreak,
    checkAndUnlockAchievements,
    checkForRewardChests,
    currentStreak,
    totalQuestionsAnswered,
    levelInfo,
  } = useGamification();
  const { addWrongAnswer } = useWrongAnswerJournal();
  const [subject, setSubject] = useState<string | null>(null);
  const [boltResult, setBoltResult] = useState<{ correct: boolean } | null>(null);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [resolving, setResolving] = useState(true);

  useEffect(() => {
    setImmersive(true);
    return () => setImmersive(false);
  }, [setImmersive]);

  useEffect(() => {
    resolveWeakestSubject().then((s) => {
      setSubject(s);
      setResolving(false);
    });
  }, []);

  const engineParams = useMemo(
    () => ({
      subject: (subject ?? "mathematics").toLowerCase(),
      count: 1,
      questionType: "any" as const,
      difficulty: "Medium" as const,
    }),
    [subject],
  );

  const { questions, isLoading, isError, refetch, isFetching } = useQuestionEngine(engineParams, {
    enabled: !!subject,
  });

  const question = questions[0];
  const subjectLabel = useMemo(() => formatSubjectLabel(subject ?? "mathematics"), [subject]);

  const quizResultDeps: QuizResultDeps = useMemo(
    () => ({
      updateStreak,
      addXp,
      checkAndUnlockAchievements,
      checkForRewardChests,
      addWrongAnswer,
      flashcardEngine,
      trackQuestionResult,
      enqueue,
      addStudySession: () => {},
      markPlanStale: () => {},
      currentStreak,
      totalQuestionsAnswered,
      levelInfo,
    }),
    [
      updateStreak,
      addXp,
      checkAndUnlockAchievements,
      checkForRewardChests,
      addWrongAnswer,
      currentStreak,
      totalQuestionsAnswered,
      levelInfo,
    ],
  );

  const processBoltResult = useCallback(
    async (correct: boolean) => {
      if (processing || !question) return;
      setProcessing(true);
      try {
        await processQuizResult(
          { source: "bolt", question: { question, correct } },
          quizResultDeps,
        );
      } catch {
        // Non-critical; user still navigates
      }
    },
    [processing, question, quizResultDeps],
  );

  const handleAnswered = useCallback((correct: boolean) => {
    setBoltResult({ correct });
  }, []);

  const handleFinish = useCallback(() => {
    if (!boltResult) return;
    void processBoltResult(boltResult.correct).then(() => {
      setIsCelebrating(true);
    });
  }, [boltResult, processBoltResult]);

  const handleContinue = useCallback(() => {
    push("/dashboard");
  }, [push]);

  const handleRetry = useCallback(() => {
    void refetch();
  }, [refetch]);

  const showLoading = resolving || isLoading;

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center gap-2.5 px-5 pt-14 pb-3">
        <BoltMark />
        <div className="flex min-w-0 flex-col">
          <span className="font-extrabold text-base text-system-text-primary tracking-tight">
            Today&rsquo;s Challenge
          </span>
          <span className="truncate text-muted-foreground text-xs">{subjectLabel}</span>
        </div>
      </header>

      <main className="flex flex-1 flex-col overflow-y-auto px-5 pb-8">
        <AnimatePresence mode="wait" initial={false}>
          {showLoading && (
            <m.section
              key="loading"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: iOSDecelerate }}
              className="flex flex-1 items-center justify-center"
            >
              <BoltLoading subjectLabel={subjectLabel} />
            </m.section>
          )}

          {!showLoading && !isError && question && !isCelebrating && (
            <m.section
              key="question"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: iOSDecelerate }}
              className="flex flex-1 flex-col items-center justify-center pt-2"
            >
              <div className="w-full max-w-2xl">
                <QuestionCard
                  question={question}
                  subject={subject ?? "mathematics"}
                  questionNumber={1}
                  totalQuestions={1}
                  onAnswered={handleAnswered}
                />
              </div>
              {boltResult && (
                <div className="sticky bottom-0 z-content -mx-5 mt-4 self-stretch border-system-separator border-t bg-system-background/90 px-5 py-4 backdrop-blur-xl">
                  <div className="mx-auto w-full max-w-2xl">
                    <Button
                      onClick={handleFinish}
                      size="lg"
                      className="w-full gap-2 text-base"
                      disabled={processing}
                    >
                      {processing ? "Saving\u2026" : "Finish"}
                    </Button>
                  </div>
                </div>
              )}
            </m.section>
          )}

          {isCelebrating && (
            <m.section
              key="celebrating"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: iOSDecelerate }}
              className="flex flex-1 items-center justify-center pt-2"
            >
              <BoltCelebration
                correct={boltResult?.correct ?? false}
                subjectLabel={subjectLabel}
                streak={currentStreak}
                onContinue={handleContinue}
              />
            </m.section>
          )}

          {!showLoading && isError && (
            <m.section
              key="error"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: iOSDecelerate }}
              className="flex flex-1 items-center justify-center"
            >
              <BoltErrorState
                onRetry={handleRetry}
                onClose={handleContinue}
                isRetrying={isFetching}
              />
            </m.section>
          )}

          {!showLoading && !isError && !question && !isFetching && !isCelebrating && (
            <m.section
              key="empty"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: iOSDecelerate }}
              className="flex flex-1 items-center justify-center"
            >
              <BoltEmptyState
                subjectLabel={subjectLabel}
                onRetry={handleRetry}
                onClose={handleContinue}
                isRetrying={isFetching}
              />
            </m.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function BoltMark() {
  return (
    <m.div
      initial={{ scale: 0.6, rotate: -10, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: iOSEase }}
      className="relative flex size-10 shrink-0 items-center justify-center rounded-2xl bg-warning/15 shadow-level-1 ring-1 ring-warning/25"
      aria-hidden="true"
    >
      <m.div
        animate={{ scale: [1, 1.06, 1], opacity: [0.55, 0.85, 0.55] }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        className="absolute inset-0 rounded-2xl bg-warning/30 blur-md"
      />
      <HugeiconsIcon
        icon={SparklesIcon}
        className="relative size-5 text-warning"
        strokeWidth={2.25}
      />
    </m.div>
  );
}

function BoltLoading({ subjectLabel }: { subjectLabel: string }) {
  return (
    <div className="flex w-full max-w-2xl flex-col gap-5">
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <div className="flex items-center gap-2 rounded-full bg-system-fill px-3 py-1.5">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-warning/60" />
            <span className="relative inline-flex size-2 rounded-full bg-warning" />
          </span>
          <span className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
            Loading your challenge
          </span>
        </div>
        <h2 className="ios-title-3 max-w-md text-balance text-foreground">
          Preparing a {subjectLabel} question
        </h2>
        <p className="max-w-sm text-balance text-muted-foreground text-sm">
          Sharpening today&rsquo;s target at your weakest spot.
        </p>
      </div>
      <Skeleton className="h-6 w-48 rounded-full" />
      <Skeleton className="h-44 w-full rounded-3xl" />
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <Skeleton className="h-14 rounded-2xl" />
        <Skeleton className="h-14 rounded-2xl" />
        <Skeleton className="h-14 rounded-2xl" />
        <Skeleton className="h-14 rounded-2xl" />
      </div>
    </div>
  );
}

function BoltErrorState({
  onRetry,
  onClose,
  isRetrying,
}: {
  onRetry: () => void;
  onClose: () => void;
  isRetrying: boolean;
}) {
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
      <div className="relative flex size-16 items-center justify-center rounded-3xl bg-destructive/10 ring-1 ring-destructive/20">
        <div className="absolute inset-0 rounded-3xl bg-destructive/20 blur-xl" />
        <HugeiconsIcon
          icon={AlertCircleIcon}
          className="relative size-7 text-destructive"
          strokeWidth={2}
        />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="ios-title-3 text-balance text-foreground">
          We couldn&rsquo;t load your challenge
        </h2>
        <p className="max-w-sm text-balance text-muted-foreground text-sm">
          Something tripped while loading today&rsquo;s question. Give it another try, or close and
          pick a different start.
        </p>
      </div>
      <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:justify-center">
        <Button
          variant="outline"
          onClick={onClose}
          className="w-full sm:w-auto"
          disabled={isRetrying}
        >
          Close
        </Button>
        <Button onClick={onRetry} className="w-full gap-2 sm:w-auto" disabled={isRetrying}>
          <HugeiconsIcon
            icon={RefreshIcon}
            className={cn("size-4", isRetrying && "animate-spin")}
          />
          {isRetrying ? "Retrying\u2026" : "Try again"}
        </Button>
      </div>
    </div>
  );
}

function BoltEmptyState({
  subjectLabel,
  onRetry,
  onClose,
  isRetrying,
}: {
  subjectLabel: string;
  onRetry: () => void;
  onClose: () => void;
  isRetrying: boolean;
}) {
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
      <div className="relative flex size-16 items-center justify-center rounded-3xl bg-system-fill ring-1 ring-system-separator">
        <HugeiconsIcon
          icon={BookOpenIcon}
          className="relative size-7 text-muted-foreground"
          strokeWidth={2}
        />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="ios-title-3 text-balance text-foreground">
          No {subjectLabel} question ready yet
        </h2>
        <p className="max-w-sm text-balance text-muted-foreground text-sm">
          We couldn&rsquo;t pull a fresh question for you right now. Try again in a moment, or close
          and browse your topics.
        </p>
      </div>
      <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:justify-center">
        <Button
          variant="outline"
          onClick={onClose}
          className="w-full sm:w-auto"
          disabled={isRetrying}
        >
          Close
        </Button>
        <Button onClick={onRetry} className="w-full gap-2 sm:w-auto" disabled={isRetrying}>
          <HugeiconsIcon
            icon={RefreshIcon}
            className={cn("size-4", isRetrying && "animate-spin")}
          />
          {isRetrying ? "Refreshing\u2026" : "Refresh Question"}
        </Button>
      </div>
    </div>
  );
}
