import { audioEngine } from "@/lib/audio-engine";
import { getWhisperService } from "@/lib/audio-engine/whisper-service";
import { savePronunciationScore } from "@/lib/pronunciation-history/service";
import { logError } from "@/lib/shared/logger";
import type { AssessmentResult } from "./scoring";
import { calcAccuracy } from "./scoring";

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function requestMicPermission(permissionRef: { current: boolean }): Promise<void> {
  try {
    await audioEngine.requestPermission();
    permissionRef.current = true;
  } catch {
    logError("PronunciationClient.permission", new Error("Mic denied"));
  }
}

export async function toggleRecording(
  permissionRef: { current: boolean },
  requestPermission: () => Promise<void>,
): Promise<void> {
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
}

export interface TranscribeCallbacks {
  setLoading: (v: boolean) => void;
  setTranscribedText: (v: string | null) => void;
  setAssessment: (v: AssessmentResult | null) => void;
  setModelState: (v: "idle" | "downloading" | "loaded" | "error") => void;
  setDownloadProgress: (v: number) => void;
}

export async function transcribeAndAssess(
  expectedText: string,
  userId: string,
  prefillLang: string,
  pollProgress: () => () => void,
  callbacks: TranscribeCallbacks,
): Promise<void> {
  const result = audioEngine.getRecordingResult();
  if (!result) return;

  callbacks.setLoading(true);
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
    callbacks.setModelState("downloading");
    const stopPolling = pollProgress();
    try {
      const svc = getWhisperService();
      const whisperResult = await svc.transcribe(result.blob);
      transcriptionText = whisperResult?.text ?? null;
    } catch (err) {
      logError("PronunciationClient.whisper", err);
    }
    stopPolling();
  }

  if (transcriptionText) {
    callbacks.setTranscribedText(transcriptionText);
    if (expectedText.trim()) {
      const svc = getWhisperService();
      const scored = svc.assessPronunciation(transcriptionText, expectedText);
      callbacks.setAssessment(scored);
      savePronunciationScore(
        userId,
        expectedText.trim().split(/\s+/)[0] || "unknown",
        scored.overallScore,
        calcAccuracy(scored.wordScores),
        scored.phonemeAccuracy,
        scored.fluencyScore,
        prefillLang,
      ).catch((e) => logError("pronunciation-save-score", e));
    }
  }

  callbacks.setLoading(false);
}

export interface ResetCallbacks {
  setTranscribedText: (v: string | null) => void;
  setAssessment: (v: AssessmentResult | null) => void;
  setExpectedText: (v: string) => void;
  setHasRecording: (v: boolean) => void;
  setModelState: (v: "idle" | "downloading" | "loaded" | "error") => void;
  setDownloadProgress: (v: number) => void;
}

export function resetAll(callbacks: ResetCallbacks): void {
  callbacks.setTranscribedText(null);
  callbacks.setAssessment(null);
  callbacks.setExpectedText("");
  audioEngine.resetRecording();
  callbacks.setHasRecording(false);
  callbacks.setModelState("idle");
  callbacks.setDownloadProgress(0);
}
