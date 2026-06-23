"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { budgetFetch } from "@/lib/shared/api-fetch";
import { ttsService } from "@/lib/utils/tts-service";
import type { TTSOptions } from "@/lib/voice-engine/types";

interface VoiceResult {
  audio: string | null;
  format: string | null;
  provider: string | null;
}

interface UseVoiceEngineReturn {
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  speak: (text: string, options?: TTSOptions) => Promise<void>;
  stop: () => void;
}

async function fetchVoice(text: string, options?: TTSOptions): Promise<VoiceResult> {
  return budgetFetch<VoiceResult>(
    "/api/engine/voice",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, options }),
    },
    "Voice",
  );
}

export function useVoiceEngine(): UseVoiceEngineReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const endUnsubscribeRef = useRef<(() => void) | null>(null);
  const errorUnsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      endUnsubscribeRef.current?.();
      errorUnsubscribeRef.current?.();
    };
  }, []);

  const cleanupListeners = useCallback(() => {
    endUnsubscribeRef.current?.();
    errorUnsubscribeRef.current?.();
    endUnsubscribeRef.current = null;
    errorUnsubscribeRef.current = null;
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    ttsService.cancel();
    cleanupListeners();
    setIsPlaying(false);
  }, [cleanupListeners]);

  const speak = useCallback(
    async (text: string, options: TTSOptions = {}) => {
      if (!text || text.trim().length === 0) return;

      stop();
      setIsLoading(true);
      setError(null);

      try {
        const result = await fetchVoice(text.slice(0, 1000), options);

        if (result.audio && result.format) {
          const audio = new Audio(`data:audio/${result.format};base64,${result.audio}`);
          audioRef.current = audio;

          audio.onended = () => {
            setIsPlaying(false);
            audioRef.current = null;
          };

          audio.onerror = () => {
            audioRef.current = null;
            void fallbackToBrowser(text, options);
          };

          setIsPlaying(true);
          await audio.play();
          setIsLoading(false);
          return;
        }
      } catch {
        /* fall through to browser */
      }

      await fallbackToBrowser(text, options);
    },
    [stop],
  );

  async function fallbackToBrowser(text: string, options: TTSOptions) {
    cleanupListeners();

    endUnsubscribeRef.current = ttsService.onEnd(() => {
      setIsPlaying(false);
      setIsLoading(false);
    });
    errorUnsubscribeRef.current = ttsService.onError(() => {
      setIsPlaying(false);
      setIsLoading(false);
      setError("Speech synthesis failed");
    });

    ttsService.speak(text, {
      lang: options.lang || "en",
      rate: options.rate || 1,
      pitch: options.pitch || 1,
    });
    setIsPlaying(true);
    setIsLoading(false);
  }

  return { isPlaying, isLoading, error, speak, stop };
}
