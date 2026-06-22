"use client";

import VolumeMute01Icon from "@hugeicons/core-free-icons/VolumeMute01Icon";
import VolumeUpIcon from "@hugeicons/core-free-icons/VolumeUpIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ttsService } from "@/lib/utils/tts-service";

interface TTSButtonProps {
  text: string;
  lang?: string;
  className?: string;
}

export function TTSButton({ text, lang, className }: TTSButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const endUnsubscribeRef = useRef<(() => void) | null>(null);
  const errorUnsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const ref = endUnsubscribeRef;
    const ref2 = errorUnsubscribeRef;
    return () => {
      ref.current?.();
      ref2.current?.();
    };
  }, []);

  const handleToggle = useCallback(() => {
    if (isPlaying) {
      ttsService.cancel();
      setIsPlaying(false);
      return;
    }

    endUnsubscribeRef.current?.();
    errorUnsubscribeRef.current?.();

    endUnsubscribeRef.current = ttsService.onEnd(() => setIsPlaying(false));
    errorUnsubscribeRef.current = ttsService.onError(() => setIsPlaying(false));
    ttsService.speak(text, { lang });
    setIsPlaying(true);
  }, [text, lang, isPlaying]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      className={cn("size-8 rounded-full", className)}
      aria-label={isPlaying ? "Stop speaking" : "Read aloud"}
    >
      {isPlaying ? (
        <HugeiconsIcon icon={VolumeMute01Icon} />
      ) : (
        <HugeiconsIcon icon={VolumeUpIcon} />
      )}
    </Button>
  );
}
