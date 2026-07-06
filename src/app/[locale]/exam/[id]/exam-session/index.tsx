"use client";

import { useTranslations } from "next-intl";
import { GamificationCelebration } from "@/components/celebration";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useExamSession } from "@/hooks/use-exam-session";
import { ExamHeader } from "./exam-header";
import { ModeSelectScreen } from "./mode-select-screen";
import { QuestionDisplay } from "./question-display";
import { QuestionNavigatorSidebar } from "./question-navigator-sidebar";
import { ResultsScreen } from "./results-screen";
import { useResumeSession } from "./resume-session";
import type { ExamSessionClientProps } from "./session-reducer";

export function ExamSessionWithResume({ id, mode }: ExamSessionClientProps) {
  const t = useTranslations();
  const { resumeData, resumeChecked, handleResume, handleStartNew } = useResumeSession(id);

  if (!resumeChecked) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Skeleton className="h-4 w-48" />
      </div>
    );
  }

  if (resumeData) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background p-4">
        <Dialog open modal>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t("exam.resumeTitle")}</DialogTitle>
              <DialogDescription>{t("exam.resumeDescription")}</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 pt-2">
              <div className="rounded-lg bg-muted p-3 text-sm">
                {resumeData.answers
                  ? t("exam.questionsAnswered", {
                      count: Object.keys(JSON.parse(resumeData.answers)).length,
                    })
                  : t("exam.noAnswersRecorded")}
              </div>
              <div className="flex flex-col gap-2">
                <Button size="lg" onClick={handleResume}>
                  {t("exam.resumeSession")}
                </Button>
                <Button variant="outline" size="lg" onClick={handleStartNew}>
                  Start New Exam
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return <ExamSessionClient id={id} mode={mode} />;
}

function ExamSessionClient({ id, mode }: ExamSessionClientProps) {
  const t = useTranslations();
  const {
    paperData,
    paperLoading,
    sessionMode,
    isMock,
    phase,
    setPhase,
    setSessionModeOverride,
    showPalette,
    setShowPalette,
    paused,
    setPaused,
    tabFocusWarn,
    answers,
    flags,
    currentPartId,
    timeRemaining,
    flatParts,
    currentPartIndex,
    currentPart,
    startSession,
    goToNext,
    goToPrevious,
    handleAnswer,
    toggleFlag,
    setCurrentPart,
    handleSubmit,
    handleDashboard,
    getAnsweredCount,
    getTotalPartsCount,
    resetSession,
    push,
  } = useExamSession(id, mode);

  if (paperLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Skeleton className="h-4 w-32" />
      </div>
    );
  }

  if (!paperData && !paperLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background p-4">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="font-medium text-destructive">{t("exam.notFound")}</p>
            <Button className="mt-4" onClick={handleDashboard}>
              {t("exam.goBack")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === "mode-select") {
    return (
      <ModeSelectScreen
        subject={paperData?.exam.metadata.subject ?? ""}
        paperCode={paperData?.exam.metadata.paperCode ?? ""}
        year={paperData?.exam.metadata.year ?? ""}
        examPeriod={paperData?.exam.metadata.examPeriod ?? ""}
        totalMarks={paperData?.exam.metadata.totalMarks ?? 0}
        duration={paperData?.exam.metadata.duration ?? ""}
        onStartPractice={startSession}
        onStartTimed={() => {
          setSessionModeOverride("timed");
          startSession();
        }}
        onStartMock={() => {
          setSessionModeOverride("mock");
          setPhase("mock-confirm");
        }}
      />
    );
  }

  if (phase === "mock-confirm") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background p-4">
        <Dialog open modal>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t("exam.mockExamTitle")}</DialogTitle>
              <DialogDescription>{t("exam.mockExamDescription")}</DialogDescription>
            </DialogHeader>
            <ul className="flex flex-col gap-2 text-muted-foreground text-sm">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-warning">\u26A0</span>
                <span>{t("exam.mockRuleNoPause")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-warning">\u26A0</span>
                <span>{t("exam.mockRuleNoBack")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-warning">\u26A0</span>
                <span>{t("exam.mockRuleNoHints")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-warning">\u26A0</span>
                <span>{t("exam.mockRuleTabFocus")}</span>
              </li>
            </ul>
            <div className="flex flex-col gap-2 pt-2">
              <Button size="lg" onClick={startSession}>
                {t("exam.beginExam")}
              </Button>
              <Button variant="outline" size="lg" onClick={() => setPhase("mode-select")}>
                {t("exam.goBack")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  if (phase === "results") {
    return (
      <ResultsScreen
        flatParts={flatParts}
        answers={answers}
        subject={paperData?.exam.metadata.subject ?? ""}
        totalMarks={paperData?.exam.metadata.totalMarks ?? 0}
        duration={paperData?.exam.metadata.duration ?? ""}
        mode={sessionMode}
        onDashboard={handleDashboard}
        onReview={() => {
          resetSession();
          push("/flashcards");
        }}
      />
    );
  }

  const answeredCount = getAnsweredCount();
  const totalPartsCount = getTotalPartsCount();

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {tabFocusWarn && (
        <div className="sticky top-0 z-modal flex items-center justify-center bg-warning p-2 text-center font-medium text-sm text-warning-foreground">
          {t("exam.mockTabFocusWarn")}
        </div>
      )}

      <ExamHeader
        paperCode={paperData?.exam.metadata.paperCode}
        sessionMode={sessionMode}
        answeredCount={answeredCount}
        totalPartsCount={totalPartsCount}
        currentPartIndex={currentPartIndex}
        timeRemaining={timeRemaining}
        paused={paused}
        onBack={() => setPhase("submitting")}
        onTogglePause={() => setPaused((p) => !p)}
        onTogglePalette={() => setShowPalette((p) => !p)}
        onSubmit={handleSubmit}
      />

      <div className="flex flex-1">
        {!isMock && (
          <QuestionNavigatorSidebar
            showPalette={showPalette}
            flatParts={flatParts}
            currentPartId={currentPartId}
            answers={answers}
            flags={flags}
            onNavigate={(partId) => {
              setCurrentPart(partId);
              setShowPalette(false);
            }}
            onClose={() => setShowPalette(false)}
          />
        )}

        <QuestionDisplay
          currentPart={currentPart}
          currentPartId={currentPartId}
          currentPartIndex={currentPartIndex}
          totalPartsCount={totalPartsCount}
          answers={answers}
          flags={flags}
          paused={paused}
          isMock={isMock}
          onAnswer={handleAnswer}
          onToggleFlag={toggleFlag}
          onPrevious={goToPrevious}
          onNext={goToNext}
          onSubmit={handleSubmit}
        />
      </div>
      <GamificationCelebration />
    </div>
  );
}
