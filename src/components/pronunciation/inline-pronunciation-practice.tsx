"use client";

import { useCallback, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import Microphone01Icon from "@hugeicons/core-free-icons/Microphone01Icon";
import CheckmarkCircle01Icon from "@hugeicons/core-free-icons/CheckmarkCircle01Icon";
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon";
import { audioEngine } from "@/lib/audio-engine/audio-engine";
import { WhisperService } from "@/lib/audio-engine/whisper-service";
import { assessPhonemes } from "@/lib/audio-engine/phoneme-service";
import { ipaToArpabet } from "@/lib/phoneme/ipa-to-arpabet";

interface InlinePronunciationPracticeProps {
  word: string;
  pronunciation?: string;
}

export function InlinePronunciationPractice({
  word,
  pronunciation,
}: InlinePronunciationPracticeProps) {
  const [state, setState] = useState<"idle" | "recording" | "assessing" | "result">("idle");
  const [score, setScore] = useState(0);
  const whisperRef = useRef<WhisperService | null>(null);

  const startRecording = useCallback(async () => {
    setState("recording");
    await audioEngine.startRecording();
  }, []);

  const stopAndAssess = useCallback(async () => {
    setState("assessing");

    audioEngine.stopRecording();
    const result = audioEngine.getRecordingResult();
    const blob = result?.blob;
    if (!blob) {
      setScore(0);
      setState("result");
      return;
    }

    try {
      const ws = whisperRef.current ?? new WhisperService();
      whisperRef.current = ws;
      const result = await ws.transcribe(blob);

      if (!result?.text) {
        setScore(0);
        setState("result");
        return;
      }

      const expectedPhonemes: string[] = pronunciation ? ipaToArpabet(pronunciation) : [];
      if (expectedPhonemes.length === 0) {
        setScore(result.confidence ? Math.round(result.confidence * 100) : 50);
        setState("result");
        return;
      }

      const { phonemeAccuracy } = assessPhonemes(result.text, word);
      setScore(phonemeAccuracy);
    } catch {
      setScore(0);
    }
    setState("result");
  }, [word, pronunciation]);

  const reset = useCallback(() => {
    setState("idle");
    setScore(0);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <span className="font-medium text-sm">{word}</span>

      {state === "idle" && (
        <button
          type="button"
          onClick={startRecording}
          className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary/20"
          aria-label={`Practice pronouncing ${word}`}
        >
          <HugeiconsIcon icon={Microphone01Icon} className="size-4" />
        </button>
      )}

      {state === "recording" && (
        <button
          type="button"
          onClick={stopAndAssess}
          className="flex size-8 items-center justify-center rounded-full bg-red-100 text-red-600 transition-colors hover:bg-red-200"
          aria-label="Stop recording"
        >
          <span className="size-3 animate-pulse rounded-full bg-red-600" />
        </button>
      )}

      {state === "assessing" && <span className="text-muted-foreground text-xs">Assessing...</span>}

      {state === "result" && (
        <div className="flex items-center gap-1.5">
          {score >= 70 ? (
            <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-4 text-green-600" />
          ) : (
            <HugeiconsIcon icon={Cancel01Icon} className="size-4 text-red-500" />
          )}
          <span
            className={`text-xs font-semibold ${score >= 70 ? "text-green-600" : "text-red-500"}`}
          >
            {score}%
          </span>
          <button
            type="button"
            onClick={reset}
            className="text-muted-foreground ml-1 text-xs underline hover:text-foreground"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
