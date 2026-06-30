"use client";

import File01Icon from "@hugeicons/core-free-icons/File01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { animate, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import * as m from "motion/react-m";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { AmbientGradient } from "@/components/shared/ambient-gradient";
import { QuestionCard, QuizSubjectPrompt } from "@/components/quiz";
import { useImmersiveMode } from "@/components/shared/immersive-mode";
import type { Question } from "@/lib/question-engine/types";
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
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-1.5 flex-1 gap-0.5 overflow-hidden rounded-full bg-border/30">
        {Array.from({ length: total }, (_, i) => (
          <m.div
            key={i}
            initial={false}
            animate={{
              backgroundColor: i < current ? "var(--system-accent)" : "transparent",
              scale: i === current ? 1.2 : 1,
            }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
            className="h-full flex-1 rounded-full transition-colors"
          />
        ))}
      </div>
      <m.span
        key={current}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
        className="font-mono text-[10px] text-muted-foreground tabular-nums"
      >
        {current}/{total}
      </m.span>
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
    (_: unknown, info: { offset: { x: number } }) => {
      const threshold = 80;
      if (info.offset.x > threshold) handlePrevious();
      else if (info.offset.x < -threshold) handleNext();
      animate(dragX, 0, { type: "spring", stiffness: 300, damping: 30, bounce: 0 });
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
        className="mx-auto flex w-full max-w-2xl flex-col gap-5 p-4 md:p-6"
        tabIndex={-1}
        drag={isQuizActive ? "x" : false}
        dragElastic={0.2}
        whileDrag={{ scale: 0.97, transition: { duration: 0.1 } }}
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

        <m.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.25, ease: [0.16, 1, 0.3, 1] }}
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
