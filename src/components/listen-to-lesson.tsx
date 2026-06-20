import { HeadphonesIcon, StopCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logError } from "@/lib/shared/logger";

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
	voice = "en_us_guy",
	className,
	onPlayingChange,
	onWordIndexChange,
}: ListenToLessonProps) {
	const [isPlaying, setIsPlaying] = useState(false);
	const [useCustomVoice, setUseCustomVoice] = useState(false);

	const synthRef = useRef<SpeechSynthesis | null>(null);
	const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
	const audioRef = useRef<HTMLAudioElement | null>(null);

	const playBrowserVoice = useCallback(
		(textToPlay: string) => {
			const utterance = new SpeechSynthesisUtterance(textToPlay);
			utterance.lang = lang === "en" ? "en-ZA" : lang;
			utterance.rate = 0.9;
			utterance.pitch = 1;
			utterance.volume = 1;

			utterance.onboundary = (event) => {
				if (event.name === "word") {
					const wordsSoFar = textToPlay
						.substring(0, event.charIndex)
						.split(" ");
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

		if (isPlaying) {
			synthRef.current?.cancel();
			audioRef.current?.pause();
			audioRef.current = null;
			setIsPlaying(false);
			setUseCustomVoice(false);
			onPlayingChange?.(false);
			onWordIndexChange?.(-1);
			return;
		}

		synthRef.current?.cancel();

		if (typeof window !== "undefined") {
			synthRef.current = window.speechSynthesis;
		}

		setIsPlaying(true);
		onPlayingChange?.(true);

		try {
			const response = await fetch("/api/tts", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					text,
					voice,
					lang,
				}),
			});

			if (response.ok) {
				const data = await response.json();
				if (data.audio) {
					setUseCustomVoice(true);
					const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
					audioRef.current = audio;

					audio.onended = () => {
						setIsPlaying(false);
						setUseCustomVoice(false);
						onPlayingChange?.(false);
						onWordIndexChange?.(-1);
					};
					audio.onerror = () => {
						setUseCustomVoice(false);
						playBrowserVoice(text);
					};
					await audio.play();
					return;
				}
			}

			const errorData = await response.json().catch(() => ({}));
			if (errorData.error) {
				console.warn(
					"TTS API error, falling back to browser:",
					errorData.error,
				);
			}
		} catch (error) {
			logError("TtsApi", error);
		}

		playBrowserVoice(text);
	}, [
		text,
		voice,
		lang,
		isPlaying,
		playBrowserVoice,
		onPlayingChange,
		onWordIndexChange,
	]);

	return (
		<Button
			size="sm"
			variant="outline"
			onClick={handleListen}
			className={cn(
				"rounded-lg px-3 text-xs",
				"transition-transform active:scale-[0.96]",
				"transition-colors duration-150 ease-[var(--ease-ios)]",
				className,
			)}
		>
			{isPlaying ? (
				<HugeiconsIcon icon={StopCircleIcon} className="mr-1.5 size-4" />
			) : (
				<HugeiconsIcon icon={HeadphonesIcon} className="mr-1.5 size-4" />
			)}
			{isPlaying
				? "Stop listening..."
				: useCustomVoice
					? "Listen to lesson"
					: "Listen to lesson"}
		</Button>
	);
}
