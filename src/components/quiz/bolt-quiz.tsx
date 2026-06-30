"use client";

import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BoltCelebration } from "@/components/dashboard/bolt-celebration";
import { useImmersiveMode } from "@/components/shared/immersive-mode";
import { Button } from "@/components/ui/button";
import { useGamification } from "@/hooks/use-gamification";
import { useNavigationDirection } from "@/hooks/use-navigation-direction";
import { useQuestionEngine } from "@/hooks/use-question-engine";
import { useWrongAnswerJournal } from "@/hooks/use-wrong-answer-journal";
import { resolveWeakestSubject, formatSubjectLabel } from "@/lib/bolt/resolve-weakest";
import { flashcardEngine } from "@/lib/flashcard-engine";
import { enqueue } from "@/lib/orchestrator/job-queue";
import { trackQuestionResult } from "@/lib/orchestrator/track-result";
import { processQuizResult, type QuizResultDeps } from "@/lib/services/quiz-result-processor";
import { iOSDecelerate } from "@/lib/utils/animation";
import { QuestionCard } from "./question-card";
import { BoltMark } from "./bolt-mark";
import { BoltLoading } from "./bolt-loading";
import { BoltErrorState } from "./bolt-error-state";
import { BoltEmptyState } from "./bolt-empty-state";

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
