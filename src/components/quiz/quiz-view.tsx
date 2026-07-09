"use client";

import File01Icon from "@hugeicons/core-free-icons/File01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AnimatePresence,
  animate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import * as m from "motion/react-m";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { AmbientGradient } from "@/components/shared/ambient-gradient";
import { QuestionCard, QuizSubjectPrompt } from "@/components/quiz";
import { useImmersiveMode } from "@/components/shared/immersive-mode";
import type { Question } from "@/lib/question-engine/types";
import { springPresets } from "@/lib/utils/spring-presets";
import { useQuizView, type QuizCompleteResult } from "./hooks/use-quiz-view";
import { QuizFooter } from "./quiz-footer";
import { QuizHeader } from "./quiz-header";
import { DecorativeRightPanel } from "./quiz-view/decorative-right-panel";
import { QuizErrorState } from "./quiz-view/quiz-error-state";
import { QuizLoadingState } from "./quiz-view/quiz-loading-state";
import { QuizNoQuestionsState } from "./quiz-view/quiz-no-questions-state";
import { QuizResultsState } from "./quiz-view/quiz-results-state";
import { QuizSubjectSelection } from "./quiz-view/quiz-subject-selection";

export type QuizResults = QuizCompleteResult;
export type QuizViewVariant = "full" | "compact";

export interface QuizViewProps {
  variant?: QuizViewVariant;
  initialSubject?: string;
  topic?: string;
  questionCount?: number;
  maxTime?: number;
  pastPaperMode?: boolean;
  packQuestions?: Question[];
  onQuit?: () => void;
  onFinish?: (results: QuizResults) => void;
  className?: string;
}

function QuizProgressBar({ current, total }: { current: number; total: number }) {
  const prefersReducedMotion = useReducedMotion();
  const progress = useMotionValue(0);
  const springProgress = useSpring(
    progress,
    prefersReducedMotion ? { stiffness: 100, damping: 26, bounce: 0 } : springPresets.fast,
  );
  const barWidth = useTransform(springProgress, (v) => `${v}%`);

  useEffect(() => {
    if (prefersReducedMotion) {
      progress.jump((current / total) * 100);
    } else {
      progress.set((current / total) * 100);
    }
  }, [current, total, progress, prefersReducedMotion]);

  return (
    <div className="flex items-center gap-3">
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-border/30">
        <m.div
          className="h-full rounded-full"
          style={{
            width: barWidth,
            background:
              "linear-gradient(90deg, var(--system-accent), color-mix(in oklch, var(--system-accent) 50%, transparent))",
          }}
        />
      </div>
      <div className="font-mono text-muted-foreground text-sm tabular-nums">
        <m.span
          key={current}
          initial={{ opacity: 0, y: -6, filter: "blur(2px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{
            type: "spring",
            stiffness: 350,
            damping: 18,
            mass: 0.6,
            duration: prefersReducedMotion ? 0 : undefined,
          }}
          className="inline-block"
        >
          {current}
        </m.span>
        <span className="text-muted-foreground/40">/{total}</span>
      </div>
    </div>
  );
}

export function QuizView({
  variant = "full",
  initialSubject,
  topic,
  questionCount = 10,
  maxTime = 90 * 60,
  pastPaperMode: initialPastPaperMode,
  packQuestions,
  onQuit,
  onFinish,
}: QuizViewProps) {
  const t = useTranslations();
  const { setImmersive } = useImmersiveMode();
  const prefersReducedMotion = useReducedMotion();
  const [localPastPaperMode, setLocalPastPaperMode] = useState(initialPastPaperMode ?? false);
  const {
    selectedSubject,
    sessionActive,
    loadError,
    currentAnswered,
    competencyData,
    resolvedTopic,
    questions,
    sources,
    warning,
    isLoading,
    isError,
    state,
    currentIndex,
    handleStartWithSubject,
    handleStop,
    handleRestart,
    handleNext,
    handlePrevious,
    handleSkip,
    handleAnswered,
    setLoadError,
  } = useQuizView({
    initialSubject,
    topic,
    questionCount,
    maxTime,
    pastPaperMode: localPastPaperMode,
    packQuestions,
    onQuit,
    onFinish,
  });

  const isQuizActive = sessionActive && questions.length > 0 && !state.isComplete;

  useEffect(() => {
    setImmersive(isQuizActive);
    return () => setImmersive(false);
  }, [isQuizActive, setImmersive]);

  const dragX = useMotionValue(0);
  const dragTransform = useTransform(dragX, (v) => `translateX(${v}px)`);

  const handleDragEnd = useCallback(
    (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
      const threshold = 80;
      if (info.offset.x > threshold) handlePrevious();
      else if (info.offset.x < -threshold) handleNext();
      animate(dragX, 0, { ...springPresets.standard, velocity: info.velocity.x });
    },
    [handleNext, handlePrevious, dragX],
  );

  if (loadError) {
    return (
      <QuizErrorState
        loadError={loadError}
        onRetry={() => {
          setLoadError(null);
          window.location.reload();
        }}
        onBack={handleStop}
      />
    );
  }

  if (!sessionActive || !selectedSubject) {
    if (variant === "compact") {
      return <QuizSubjectPrompt onSelect={() => handleStartWithSubject("")} hasSubject={false} />;
    }
    return (
      <QuizSubjectSelection
        onSelect={(s) => handleStartWithSubject(s)}
        pastPaperMode={localPastPaperMode}
        onPastPaperModeChange={setLocalPastPaperMode}
      />
    );
  }

  if (isLoading) {
    return (
      <QuizLoadingState
        resolvedTopic={resolvedTopic}
        topicCompetencyLevel={competencyData.topicCompetencyLevel}
        topicCompetencyScore={competencyData.topicCompetencyScore}
      />
    );
  }

  if (isError) {
    return (
      <div className="grid min-h-dvh grid-cols-12 gap-0 bg-background">
        <div className="col-span-12 col-start-1 flex items-center justify-center p-4 pb-(--space-20) md:col-span-7">
          <QuizNoQuestionsState
            selectedSubject={selectedSubject}
            onBack={handleStop}
            warning={warning}
          />
        </div>
        <DecorativeRightPanel variant="destructive" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <QuizNoQuestionsState
        selectedSubject={selectedSubject}
        onBack={handleStop}
        warning={warning}
      />
    );
  }

  if (state.isComplete) {
    return (
      <QuizResultsState
        totalQuestions={state.totalQuestions}
        correctAnswers={state.correctAnswers}
        elapsedTime={state.elapsedTime}
        subject={selectedSubject ?? "Quiz"}
        sources={sources}
        questions={state.questions}
        correctness={state.correctness}
        userAnswers={state.userAnswers}
        onRestart={handleRestart}
        onDashboard={handleStop}
      />
    );
  }

  return (
    <section className="min-h-dvh bg-background" aria-label="Quiz Practice">
      <AmbientGradient variant="quiz" />

      <m.main
        className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 md:p-6"
        tabIndex={-1}
        drag={isQuizActive ? "x" : false}
        dragElastic={0.2}
        whileDrag={{ scale: 0.97, transition: { duration: 0.2 } }}
        style={{ transform: dragTransform }}
        onDragEnd={handleDragEnd}
      >
        {localPastPaperMode && (
          <m.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
            className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-warning text-xs"
          >
            <HugeiconsIcon icon={File01Icon} className="size-4" />
            <span>{t("quiz.pastPaperMode")}</span>
          </m.div>
        )}

        <QuizProgressBar current={currentIndex + 1} total={state.totalQuestions} />

        <QuizHeader
          elapsedTime={state.elapsedTime}
          currentIndex={currentIndex}
          totalQuestions={state.totalQuestions}
          correctAnswers={state.correctAnswers}
          onQuit={handleStop}
        />

        <AnimatePresence mode="popLayout">
          <m.div
            key={currentIndex}
            layout
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{
              opacity: 0,
              scale: 0.94,
              y: -6,
              transition: springPresets.cardExit,
            }}
            transition={prefersReducedMotion ? { duration: 0 } : springPresets.standard}
          >
            {state.currentQuestion && (
              <QuestionCard
                question={state.currentQuestion}
                subject={selectedSubject}
                questionNumber={state.questionNumber}
                totalQuestions={state.totalQuestions}
                onNext={handleNext}
                onAnswered={handleAnswered}
              />
            )}
          </m.div>
        </AnimatePresence>

        <QuizFooter
          currentIndex={currentIndex}
          totalQuestions={state.totalQuestions}
          hasSelected={currentAnswered}
          showFeedback={currentAnswered}
          variant={variant}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onSkip={handleSkip}
        />
      </m.main>
    </section>
  );
}
