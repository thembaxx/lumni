"use client";

import VolumeMute01Icon from "@hugeicons/core-free-icons/VolumeMute01Icon";
import VolumeUpIcon from "@hugeicons/core-free-icons/VolumeUpIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useVoiceEngine } from "@/hooks/use-voice-engine";
import { cn } from "@/lib/utils";

interface TTSButtonProps {
  text: string;
  lang?: string;
  className?: string;
  visualDescription?: string;
}

export function TTSButton({ text, lang, className, visualDescription }: TTSButtonProps) {
  const { isPlaying, isLoading, speak, stop } = useVoiceEngine();

  const ttsText = visualDescription ? `${visualDescription}. ${text}` : text;

  const handleToggle = useCallback(() => {
    if (isPlaying || isLoading) {
      stop();
      return;
    }
    void speak(ttsText, { lang });
  }, [ttsText, lang, isPlaying, isLoading, speak, stop]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      className={cn("size-8 rounded-full", className)}
      aria-label={isPlaying ? "Stop speaking" : isLoading ? "Loading speech" : "Read aloud"}
      disabled={isLoading}
    >
      {isPlaying ? (
        <HugeiconsIcon icon={VolumeMute01Icon} data-icon />
      ) : (
        <HugeiconsIcon icon={VolumeUpIcon} data-icon />
      )}
    </Button>
  );
}
