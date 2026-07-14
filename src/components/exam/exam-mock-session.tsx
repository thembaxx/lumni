"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { useImmersiveMode } from "@/components/shared/immersive-mode";
import { Button } from "@/components/ui/button";
import { useQuestionEngine } from "@/hooks/use-question-engine";
import type { UserAnswer } from "@/lib/question-engine/types";
import { getAPSForSubject, getGrade } from "@/lib/shared/aps";
import { cn } from "@/lib/utils";
import { logError } from "@/lib/shared/logger";

interface MockAnswerRecord {
  answer: UserAnswer;
  gradingResult?: { correct: boolean; score: number };
}

interface ExamMockSessionProps {
  subject: string;
  topic?: string;
  duration: number;
  questionCount: number;
  onFinish?: (results: {
    questions: { id: string }[];
    correctness: boolean[];
    correctAnswers: number;
    totalQuestions: number;
    elapsedTime: number;
  }) => void;
}

type Phase = "generating" | "countdown" | "active" | "submitting" | "results";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function ExamMockSession({
  subject,
  topic,
  duration,
  questionCount,
  onFinish,
}: ExamMockSessionProps) {
  const [phase, setPhase] = useState<Phase>("generating");
  const [countdownValue, setCountdownValue] = useState(3);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, MockAnswerRecord>>({});
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const startTimeRef = useRef<number>(0);

  const { setImmersive } = useImmersiveMode();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const submitRef = useRef<() => void>(undefined as unknown as () => void);
  const answersRef = useRef(answers);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    startTimeRef.current = Date.now();
  }, []);

  const generationParams = useMemo(
    () => ({
      subject,
      topic,
      count: questionCount,
      questionType: "any" as const,
    }),
    [subject, topic, questionCount],
  );

  const { questions, isLoading, generate } = useQuestionEngine(generationParams, {
    enabled: true,
  });

  const handleSubmit = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("submitting");

    const current = answersRef.current;
    const mcqQuestions = questions.filter((q) => q.type === "multiple-choice");
    const results = mcqQuestions.map((q) => {
      const record = current[q.id];
      return record?.gradingResult?.correct ?? false;
    });

    const correctAnswers = results.filter(Boolean).length;
    const elapsedTime = Math.round((Date.now() - startTimeRef.current) / 1000);

    setTimeout(() => {
      setPhase("results");
    }, 300);

    onFinish?.({
      questions: mcqQuestions.map((q) => ({ id: q.id })),
      correctness: results,
      correctAnswers,
      totalQuestions: mcqQuestions.length,
      elapsedTime,
    });
  }, [questions, onFinish]);

  useEffect(() => {
    submitRef.current = handleSubmit;
  }, [handleSubmit]);

  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdownValue <= 0) {
      setPhase("active");
      return;
    }
    const t = setTimeout(() => setCountdownValue((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, countdownValue]);

  useEffect(() => {
    if (phase !== "active") {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          submitRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  useEffect(() => {
    if (isLoading) return;
    if (questions.length === 0) {
      generate(generationParams)
        .then(() => setPhase("countdown"))
        .catch((err) => logError("ExamMockSession.generate", err));
    } else if (phase === "generating") {
      setPhase("countdown");
    }
  }, [isLoading, questions.length, generate, generationParams, phase]);

  useEffect(() => {
    setImmersive(phase === "active" || phase === "countdown");
    return () => setImmersive(false);
  }, [phase, setImmersive]);

  const handleAnswer = useCallback(
    (questionId: string, answer: UserAnswer) => {
      const idx = questions.findIndex((q) => q.id === questionId);
      if (idx < 0) return;
      const q = questions[idx];
      const body = q.body;
      const isMCQ = q.type === "multiple-choice";
      let correct = false;
      let score = 0;

      if (isMCQ && body && "options" in body) {
        const opts = (body as { options: { id: string; isCorrect: boolean }[] }).options ?? [];
        const selectedId = Array.isArray(answer.value) ? answer.value[0] : answer.value;
        const selected = opts.find((o) => o.id === selectedId);
        correct = selected?.isCorrect ?? false;
        score = correct ? 1 : 0;
      }

      setAnswers((prev) => ({
        ...prev,
        [questionId]: { answer, gradingResult: { correct, score } },
      }));
    },
    [questions],
  );

  const goToNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  }, [currentIndex, questions.length]);

  const currentQuestion = questions[currentIndex];

  if (phase === "generating") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-background gap-4 p-4">
        <div className="size-8 animate-spin rounded-full border-foreground border-b-2" />
        <p className="text-muted-foreground text-sm">Generating mock exam...</p>
      </div>
    );
  }

  if (phase === "countdown") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-background gap-4 p-4">
        <p className="font-bold text-7xl tracking-tight tabular-nums text-system-accent">
          {countdownValue}
        </p>
        <p className="text-muted-foreground text-sm">Get ready for your mock exam</p>
      </div>
    );
  }

  if (phase === "results") {
    const mcqQuestions = questions.filter((q) => q.type === "multiple-choice");
    const correctCount = mcqQuestions.filter((q) => answers[q.id]?.gradingResult?.correct).length;
    const total = mcqQuestions.length;
    const pct = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-background p-6 gap-6">
        <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border border-border bg-card p-6 text-center">
          <p className="font-bold text-2xl tracking-tight">Mock Exam Complete</p>
          <div className="flex items-baseline gap-1">
            <span className="font-bold text-5xl tabular-nums text-system-accent">{pct}%</span>
            <span className="text-muted-foreground text-sm tabular-nums">
              ({correctCount}/{total})
            </span>
          </div>
          <p className="text-muted-foreground text-xs">{getGrade(pct)}</p>
          <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2">
            <span className="text-muted-foreground text-xs">APS Projection:</span>
            <span className="font-bold text-lg tabular-nums text-system-accent">
              {getAPSForSubject(pct)}/7
            </span>
          </div>
          <div className="flex w-full flex-col gap-2 pt-2">
            <Button size="lg" onClick={() => window.history.back()}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isMCQ = currentQuestion?.type === "multiple-choice";
  const body =
    isMCQ && currentQuestion?.body && "options" in currentQuestion.body
      ? (currentQuestion.body as { options: { id: string; text: string; isCorrect: boolean }[] })
      : null;

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="ios-caption-3 rounded-md bg-system-accent px-2 py-0.5 font-semibold text-system-accent-foreground text-xs">
            Mock
          </span>
          <span className="text-muted-foreground text-xs">
            Q {currentIndex + 1}/{questions.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "font-bold text-lg tabular-nums",
              timeRemaining <= 60 ? "text-destructive" : "text-foreground",
            )}
          >
            {formatTime(timeRemaining)}
          </span>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-6 overflow-y-auto p-4">
        {currentQuestion && (
          <div className="mx-auto w-full max-w-2xl">
            <MarkdownRenderer
              content={currentQuestion.questionText}
              subject={subject}
              className="mb-6 text-lg leading-relaxed"
            />

            {isMCQ && body && (
              <div className="flex flex-col gap-2">
                {body.options.map((option) => {
                  const selectedAnswer = answers[currentQuestion.id]?.answer;
                  const selectedId =
                    selectedAnswer && Array.isArray(selectedAnswer.value)
                      ? selectedAnswer.value[0]
                      : selectedAnswer?.value;
                  const isSelected = selectedId === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() =>
                        handleAnswer(currentQuestion.id, {
                          type: "option-ids",
                          value: [option.id],
                        })
                      }
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-[scale,background-color,border-color] press-scale",
                        isSelected
                          ? "border-system-accent bg-system-accent/10 font-medium"
                          : "border-border bg-card hover:bg-muted/50",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
                          isSelected
                            ? "border-system-accent bg-system-accent text-system-accent-foreground"
                            : "border-muted-foreground/30 text-muted-foreground",
                        )}
                      >
                        {String.fromCharCode(65 + body.options.indexOf(option))}
                      </span>
                      <MarkdownRenderer
                        content={option.text}
                        subject={subject}
                        className="text-sm"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="sticky bottom-0 flex items-center justify-between border-t border-border bg-card px-4 py-3">
        <div className="text-muted-foreground text-xs">{Object.keys(answers).length} answered</div>
        {currentIndex < questions.length - 1 ? (
          <Button onClick={goToNext} size="lg">
            Next
          </Button>
        ) : (
          <Button onClick={handleSubmit} size="lg">
            Submit Exam
          </Button>
        )}
      </footer>
    </div>
  );
}
