"use client";

import Mic01Icon from "@hugeicons/core-free-icons/Mic01Icon";
import StopCircleIcon from "@hugeicons/core-free-icons/StopCircleIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { FadeIn } from "@/components/shared/fade-in";
import { TTSButton } from "@/components/shared/tts-button";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AmbientGradient } from "@/components/shared/ambient-gradient";
import { PageContainer } from "@/components/layout/page-container";
import { motionEase } from "@/lib/utils/animation";
import { useAuth } from "@/lib/auth/auth-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { audioEngine } from "@/lib/audio-engine";
import { getWhisperService } from "@/lib/audio-engine/whisper-service";
import { savePronunciationScore } from "@/lib/pronunciation-history/service";
import { logError } from "@/lib/shared/logger";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface WordScore {
  word: string;
  accuracy: number;
  isCorrect: boolean;
}

export function PronunciationClient() {
  const searchParams = useSearchParams();
  const prefillText = searchParams.get("text") ?? "";
  const prefillLang = searchParams.get("lang") ?? "en";
  const { user } = useAuth();
  const userId = user?.$id ?? "anonymous";
  const prefersReducedMotion = useReducedMotion();
  const [expectedText, setExpectedText] = useState(prefillText);
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState<string | null>(null);
  const [assessment, setAssessment] = useState<{
    overallScore: number;
    wordScores: WordScore[];
    fluencyScore: number;
    phonemeAccuracy: number;
    phonemeDetails: {
      expected: string;
      actual: string;
      correct: boolean;
      position: number;
    }[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyStats, setHistoryStats] = useState<{
    totalAttempts: number;
    averageScore: number;
    recentScores: { date: string; score: number }[];
    topWords: { word: string; count: number; avgScore: number }[];
  } | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const permissionRef = useRef(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [modelState, setModelState] = useState<"idle" | "downloading" | "loaded" | "error">("idle");
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const unsub = audioEngine.subscribe(() => {
      const state = audioEngine.getState();
      setIsRecording(state.isRecording);
      setHasRecording(!!state.audioBlob);
    });
    return unsub;
  }, []);

  const pollProgress = useCallback(() => {
    const svc = getWhisperService();
    svc.onDownloadProgress((pct) => {
      setDownloadProgress(pct);
    });
    progressInterval.current = setInterval(() => {
      const pct = svc.getDownloadProgress();
      setDownloadProgress(pct);
      if (pct >= 100 || svc.getLoadState() === "loaded") {
        setModelState("loaded");
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
        }
      }
    }, 200);
  }, []);

  const requestPermission = useCallback(async () => {
    try {
      await audioEngine.requestPermission();
      permissionRef.current = true;
    } catch {
      logError("PronunciationClient.permission", new Error("Mic denied"));
    }
  }, []);

  const handleRecord = useCallback(async () => {
    if (!permissionRef.current) {
      await requestPermission();
    }
    const state = audioEngine.getState();
    if (state.isRecording) {
      audioEngine.stopRecording();
      return;
    }
    try {
      audioEngine.resetRecording();
      await audioEngine.startRecording();
    } catch (err) {
      logError("PronunciationClient.record", err);
    }
  }, [requestPermission]);

  const blobToBase64 = useCallback((blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }, []);

  const handleTranscribe = useCallback(async () => {
    const result = audioEngine.getRecordingResult();
    if (!result) return;

    setLoading(true);
    let transcriptionText: string | null = null;

    try {
      const base64 = await blobToBase64(result.blob);
      const res = await fetch("/api/engine/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audio: base64, format: result.blob.type }),
      });
      const data = await res.json();

      if (data.text) {
        transcriptionText = data.text;
      }
    } catch {
      // server unavailable, fall through to whisper
    }

    if (!transcriptionText) {
      setModelState("downloading");
      pollProgress();
      try {
        const service = getWhisperService();
        const whisperResult = await service.transcribe(result.blob);
        transcriptionText = whisperResult?.text ?? null;
      } catch (err) {
        logError("PronunciationClient.whisper", err);
      }
    }

    if (transcriptionText) {
      setTranscribedText(transcriptionText);
      if (expectedText.trim()) {
        const service = getWhisperService();
        const scored = service.assessPronunciation(transcriptionText, expectedText);
        setAssessment(scored);
        savePronunciationScore(
          userId,
          expectedText.trim().split(/\s+/)[0] || "unknown",
          scored.overallScore,
          (scored.wordScores.filter((w) => w.isCorrect).length /
            Math.max(scored.wordScores.length, 1)) *
            100,
          scored.phonemeAccuracy,
          scored.fluencyScore,
          prefillLang,
        ).catch(() => {});
      }
    }

    setLoading(false);
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
  }, [expectedText, pollProgress, blobToBase64, userId, prefillLang]);

  const handleReset = useCallback(() => {
    setTranscribedText(null);
    setAssessment(null);
    setExpectedText("");
    audioEngine.resetRecording();
    setHasRecording(false);
    setModelState("idle");
    setDownloadProgress(0);
  }, []);

  const handleLoadHistory = useCallback(async () => {
    setShowHistory((prev) => {
      if (!prev) {
        setHistoryLoading(true);
        import("@/lib/pronunciation-history/service").then((mod) => {
          mod.getPronunciationStats(userId).then((stats) => {
            setHistoryStats(stats);
            setHistoryLoading(false);
          });
        });
      }
      return !prev;
    });
  }, [userId]);

  return (
    <div className="min-h-dvh bg-system-grouped pt-4 pb-24">
      <AmbientGradient />
      <PageContainer className="flex flex-col gap-6">
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: motionEase }}
        >
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-2">
              <h1 className="ios-title-1 font-extrabold text-foreground tracking-tight">
                Pronunciation Practice
              </h1>
              <p className="text-muted-foreground text-sm">
                Type a phrase, record yourself, and get feedback on your pronunciation
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLoadHistory} className="rounded-full">
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
                ~74MB download (one-time). This enables offline speech recognition in 99+ languages
                including Afrikaans, isiZulu, and isiXhosa.
              </p>
            </CardContent>
          </Card>
        )}

        {modelState === "error" && (
          <Card className="overflow-hidden rounded-3xl border-destructive/20 bg-destructive/5 shadow-level-1">
            <CardContent className="p-5">
              <p className="font-semibold text-destructive text-sm">Failed to load speech model</p>
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
              {loading ? "Transcribing…" : "Analyze Pronunciation"}
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
                <CardTitle className="font-semibold text-base">Pronunciation Assessment</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-5 p-5 pt-0">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-info/10 p-4 text-center">
                    <div className="font-extrabold text-3xl text-info tabular-nums">
                      {assessment.overallScore}%
                    </div>
                    <div className="mt-1 text-muted-foreground text-xs">Accuracy</div>
                  </div>
                  <div className="rounded-2xl bg-success/10 p-4 text-center">
                    <div className="font-extrabold text-3xl text-success tabular-nums">
                      {assessment.phonemeAccuracy}%
                    </div>
                    <div className="mt-1 text-muted-foreground text-xs">Phonemes</div>
                  </div>
                  <div className="rounded-2xl bg-warning/10 p-4 text-center">
                    <div className="font-extrabold text-3xl text-warning tabular-nums">
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
                {historyLoading ? (
                  <div className="flex flex-col gap-3">
                    <Skeleton className="h-8 w-24 rounded-2xl" />
                    <Skeleton className="h-4 w-48 rounded-2xl" />
                    <Skeleton className="h-24 w-full rounded-3xl" />
                  </div>
                ) : historyStats && historyStats.totalAttempts > 0 ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-card p-4 text-center">
                        <div className="font-extrabold text-3xl tabular-nums">
                          {historyStats.totalAttempts}
                        </div>
                        <div className="mt-1 text-muted-foreground text-xs">Total Attempts</div>
                      </div>
                      <div className="rounded-2xl bg-card p-4 text-center">
                        <div className="font-extrabold text-3xl tabular-nums">
                          {historyStats.averageScore}%
                        </div>
                        <div className="mt-1 text-muted-foreground text-xs">Average Score</div>
                      </div>
                    </div>

                    {historyStats.recentScores.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <span className="font-semibold text-sm">Score Trend</span>
                        <ResponsiveContainer width="100%" height={160}>
                          <BarChart data={historyStats.recentScores} barCategoryGap="20%">
                            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                            <Tooltip />
                            <Bar
                              dataKey="score"
                              radius={[4, 4, 0, 0]}
                              fill="var(--color-accent, oklch(52% 0.18 146))"
                            />
                          </BarChart>
                        </ResponsiveContainer>
                        <ResponsiveContainer width="100%" height={80}>
                          <LineChart data={historyStats.recentScores}>
                            <XAxis dataKey="date" hide />
                            <YAxis domain={[0, 100]} hide />
                            <Line
                              type="monotone"
                              dataKey="score"
                              stroke="var(--color-accent)"
                              strokeWidth={2}
                              dot={{ r: 3 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {historyStats.topWords.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <span className="font-semibold text-sm">Most Practiced Words</span>
                        <div className="flex flex-wrap gap-2">
                          {historyStats.topWords.map((w) => (
                            <Badge
                              key={w.word}
                              variant="outline"
                              className="rounded-full px-3 py-1 text-xs"
                            >
                              {w.word} — {w.count}x ({w.avgScore}%)
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No pronunciation history yet. Practice some words to see your progress!
                  </p>
                )}
              </CardContent>
            </Card>
          </FadeIn>
        )}
      </PageContainer>
    </div>
  );
}
