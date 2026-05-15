"use client";

import { SpeakerHigh, SpeakerSlash } from "@phosphor-icons/react";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/shared";
import { ttsService } from "@/lib/utils/tts-service";

interface TTSButtonProps {
	text: string;
	lang?: string;
	className?: string;
}

export function TTSButton({ text, lang, className }: TTSButtonProps) {
	const [isPlaying, setIsPlaying] = useState(false);

	const handleToggle = useCallback(() => {
		if (isPlaying) {
			ttsService.cancel();
			setIsPlaying(false);
			return;
		}

		ttsService.onEnd(() => setIsPlaying(false));
		ttsService.onError(() => setIsPlaying(false));
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
				<SpeakerSlash className="size-4" />
			) : (
				<SpeakerHigh className="size-4" />
			)}
		</Button>
	);
}
