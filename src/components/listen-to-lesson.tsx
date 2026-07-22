import HeadphonesIcon from "@hugeicons/core-free-icons/HeadphonesIcon";
import StopCircleIcon from "@hugeicons/core-free-icons/StopCircleIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useVoiceEngine } from "@/hooks/use-voice-engine";
import { ttsService } from "@/lib/utils/tts-service";
import { cn } from "@/lib/utils";

interface ListenToLessonProps {
  text: string;
  lang?: string;
  voice?: string;
  className?: string;
  onPlayingChange?: (isPlaying: boolean) => void;
  onWordIndexChange?: (index: number) => void;
}

export function ListenToLesson({
  text,
  lang = "en",
  voice,
  className,
  onPlayingChange,
  onWordIndexChange,
}: ListenToLessonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const { isLoading, speak: voiceSpeak, stop: stopVoice } = useVoiceEngine();
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const playBrowserVoice = useCallback(
    (textToPlay: string) => {
      const utterance = new SpeechSynthesisUtterance(textToPlay);
      utterance.lang = lang === "en" ? "en-ZA" : lang;
      utterance.rate = 0.9;
      utterance.pitch = 1;

      utterance.onboundary = (event) => {
        if (event.name === "word") {
          const wordsSoFar = textToPlay.substring(0, event.charIndex).split(" ");
          onWordIndexChange?.(wordsSoFar.length - 1);
        }
      };

      utterance.onend = () => {
        setIsPlaying(false);
        onPlayingChange?.(false);
        onWordIndexChange?.(-1);
      };

      utterance.onerror = () => {
        setIsPlaying(false);
        onPlayingChange?.(false);
        onWordIndexChange?.(-1);
      };

      utteranceRef.current = utterance;
      synthRef.current?.speak(utterance);
    },
    [lang, onPlayingChange, onWordIndexChange],
  );

  const handleListen = useCallback(async () => {
    if (!text) return;

    if (isPlaying || isLoading) {
      stopVoice();
      ttsService.cancel();
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      setIsPlaying(false);
      onPlayingChange?.(false);
      onWordIndexChange?.(-1);
      return;
    }

    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
    }

    setIsPlaying(true);
    onPlayingChange?.(true);

    await voiceSpeak(text, { lang, voice });

    if (utteranceRef.current) {
      return;
    }

    playBrowserVoice(text);
  }, [
    text,
    voice,
    lang,
    isPlaying,
    isLoading,
    voiceSpeak,
    stopVoice,
    onPlayingChange,
    onWordIndexChange,
    playBrowserVoice,
  ]);

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleListen}
      className={cn(
        "rounded-md px-3 text-xs",
        "transition-transform press-scale",
        "transition-colors duration-150 ease-(--ease-ios)",
        className,
      )}
      disabled={isLoading}
    >
      {isPlaying ? (
        <HugeiconsIcon icon={StopCircleIcon} data-icon="inline-start" />
      ) : (
        <HugeiconsIcon icon={HeadphonesIcon} data-icon="inline-start" />
      )}
      {isPlaying ? "Stop listening..." : "Listen to lesson"}
    </Button>
  );
}
