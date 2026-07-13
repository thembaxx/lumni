"use client";

import Mic01Icon from "@hugeicons/core-free-icons/Mic01Icon";
import StopCircleIcon from "@hugeicons/core-free-icons/StopCircleIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { FadeIn } from "@/components/shared/fade-in";
import { TTSButton } from "@/components/shared/tts-button";
import { usePronunciationSession } from "@/hooks/use-pronunciation-session";
import { AmbientGradient } from "@/components/shared/ambient-gradient";
import { SpotlightCard } from "@/components/shared/motion-primitives";
import { PageContainer } from "@/components/layout/page-container";
import { motionEase } from "@/lib/utils/animation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { HistoryChart } from "./history-chart";

export function PronunciationClient() {
  const prefersReducedMotion = useReducedMotion();

  const {
    expectedText,
    setExpectedText,
    isRecording,
    hasRecording,
    transcribedText,
    assessment,
    loading,
    showHistory,
    historyLoading,
    historyStats,
    downloadProgress,
    modelState,
    prefillLang,
    handleRecord,
    handleTranscribe,
    handleReset,
    handleLoadHistory,
  } = usePronunciationSession();

  return (
    <div className="min-h-dvh bg-system-grouped pt-4">
      <AmbientGradient />
      <PageContainer className="flex flex-col gap-6">
        <SpotlightCard radius={300}>
          <m.div
            initial={prefersReducedMotion ? undefined : { opacity: 0, y: 12 }}
            animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            transition={prefersReducedMotion ? undefined : { duration: 0.3, ease: motionEase }}
          >
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-2">
                <h1 className="ios-title-1 font-bold text-foreground tracking-tight">
                  Pronunciation Practice
                </h1>
                <p className="text-muted-foreground text-sm">
                  Type a phrase, record yourself, and get feedback on your pronunciation
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLoadHistory}
                className="rounded-full"
              >
                {showHistory ? "Hide History" : "View History"}
              </Button>
            </div>
          </m.div>

          {modelState === "downloading" && (
            <Card className="overflow-hidden rounded-3xl border-info/20 bg-info/5 shadow-level-1">
              <CardContent className="flex flex-col gap-3 p-5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">Downloading speech model...</span>
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {downloadProgress}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-(--system-accent) transition-[width] duration-300"
                    style={{ width: `${downloadProgress}%` }}
                  />
                </div>
                <p className="text-muted-foreground text-xs">
                  ~74MB download (one-time). This enables offline speech recognition in 99+
                  languages including Afrikaans, isiZulu, and isiXhosa.
                </p>
              </CardContent>
            </Card>
          )}

          {modelState === "error" && (
            <Card className="overflow-hidden rounded-3xl border-destructive/20 bg-destructive/5 shadow-level-1">
              <CardContent className="p-5">
                <p className="font-semibold text-destructive text-sm">
                  Failed to load speech model
                </p>
                <p className="text-muted-foreground text-xs">
                  Check your internet connection and try again.
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="overflow-hidden rounded-3xl shadow-level-1">
            <CardHeader>
              <CardTitle className="font-semibold text-base">What to practice</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 p-5 pt-0">
              <Textarea
                value={expectedText}
                onChange={(e) => setExpectedText(e.target.value)}
                placeholder="Type a word or phrase to practice..."
                className="min-h-20 resize-none rounded-2xl text-base"
                aria-label="Text to practice"
              />
              {expectedText.trim() && (
                <div className="flex justify-end px-1">
                  <TTSButton text={expectedText} lang={prefillLang} />
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant={isRecording ? "destructive" : "default"}
              size="lg"
              onClick={handleRecord}
              className={isRecording ? "animate-pulse rounded-full" : "rounded-full"}
              aria-label={isRecording ? "Stop recording" : "Start recording"}
            >
              <HugeiconsIcon icon={isRecording ? StopCircleIcon : Mic01Icon} className="size-5" />
              {isRecording ? "Stop Recording" : "Start Recording"}
            </Button>

            {hasRecording && !isRecording && (
              <Button
                variant="outline"
                size="lg"
                onClick={handleTranscribe}
                disabled={loading}
                className="rounded-full"
              >
                {loading ? "Transcribing\u2026" : "Analyze Pronunciation"}
              </Button>
            )}

            {(transcribedText || assessment) && (
              <Button variant="ghost" size="lg" onClick={handleReset} className="rounded-full">
                Try again
              </Button>
            )}
          </div>

          {transcribedText && (
            <FadeIn direction="up" distance={16} duration={0.4}>
              <Card className="overflow-hidden rounded-3xl shadow-level-1">
                <CardHeader>
                  <CardTitle className="font-semibold text-base">Transcription</CardTitle>
                </CardHeader>
                <CardContent className="p-5 pt-0">
                  <p className="leading-relaxed">{transcribedText}</p>
                </CardContent>
              </Card>
            </FadeIn>
          )}

          {assessment && (
            <FadeIn direction="up" distance={16} duration={0.4} delay={0.1}>
              <Card className="overflow-hidden rounded-3xl shadow-level-1">
                <CardHeader>
                  <CardTitle className="font-semibold text-base">
                    Pronunciation Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-5 p-5 pt-0">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-2xl bg-info/10 p-4 text-center">
                      <div className="font-bold text-3xl text-info tabular-nums">
                        {assessment.overallScore}%
                      </div>
                      <div className="mt-1 text-muted-foreground text-xs">Accuracy</div>
                    </div>
                    <div className="rounded-2xl bg-success/10 p-4 text-center">
                      <div className="font-bold text-3xl text-success tabular-nums">
                        {assessment.phonemeAccuracy}%
                      </div>
                      <div className="mt-1 text-muted-foreground text-xs">Phonemes</div>
                    </div>
                    <div className="rounded-2xl bg-warning/10 p-4 text-center">
                      <div className="font-bold text-3xl text-warning tabular-nums">
                        {assessment.fluencyScore}%
                      </div>
                      <div className="mt-1 text-muted-foreground text-xs">Fluency</div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="font-semibold text-sm">Word-by-word breakdown</span>
                    <div className="flex flex-wrap gap-2">
                      {assessment.wordScores.map((ws) => (
                        <Badge
                          key={ws.word}
                          variant="outline"
                          className={`rounded-full px-3 py-1 text-sm ${
                            ws.isCorrect
                              ? "border-success/30 bg-success/10 text-success"
                              : "border-destructive/30 bg-destructive/10 text-destructive"
                          }`}
                        >
                          {ws.word}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          )}

          {showHistory && (
            <FadeIn direction="up" distance={16} duration={0.4}>
              <Card className="overflow-hidden rounded-3xl shadow-level-1">
                <CardHeader>
                  <CardTitle className="font-semibold text-base">Pronunciation History</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-5 p-5 pt-0">
                  <HistoryChart stats={historyStats} loading={historyLoading} />
                </CardContent>
              </Card>
            </FadeIn>
          )}
        </SpotlightCard>
      </PageContainer>
    </div>
  );
}
