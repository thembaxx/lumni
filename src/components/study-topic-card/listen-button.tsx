import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ListenButtonProps {
	className?: string;
	text: string;
	lang?: string;
	voice?: string;
	onClick?: () => void;
}

export function ListenButton({
	className,
	text,
	lang = "en",
	voice = "en_us_guy",
	onClick,
}: ListenButtonProps) {
	const [isPlaying, setIsPlaying] = useState(false);
	const [useCustomVoice, setUseCustomVoice] = useState(false);

	const synthRef = useRef<SpeechSynthesis | null>(null);
	const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
	const audioRef = useRef<HTMLAudioElement | null>(null);

	const playBrowserVoice = useCallback((textToPlay: string) => {
		const utterance = new SpeechSynthesisUtterance(textToPlay);
		utterance.lang = lang === "en" ? "en-ZA" : lang;
		utterance.rate = 0.9;
		utterance.pitch = 1;
		utterance.volume = 1;

		utterance.onend = () => {
			setIsPlaying(false);
		};

		utterance.onerror = () => {
			setIsPlaying(false);
		};

		utteranceRef.current = utterance;
		synthRef.current?.speak(utterance);
	}, [lang]);

	const handleListen = useCallback(async () => {
		if (!text) return;

		if (isPlaying) {
			synthRef.current?.cancel();
			audioRef.current?.pause();
			audioRef.current = null;
			setIsPlaying(false);
			setUseCustomVoice(false);
			return;
		}

		synthRef.current?.cancel();

		setIsPlaying(true);

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
					};
					audio.onerror = () => {
						setUseCustomVoice(false);
						playBrowserVoice(text);
					};
					await audio.play();
					onClick?.();
					return;
				}
			}
		} catch (error) {
			console.error("TTS API error, falling back to browser:", error);
		}

		playBrowserVoice(text);
		onClick?.();
	}, [text, voice, lang, isPlaying, playBrowserVoice, onClick]);

	return (
		<Button
			size="sm"
			variant="outline"
			onClick={handleListen}
			className={cn(
				"h-8 px-3 text-xs rounded-lg",
				"active:scale-[0.96] transition-transform",
				"transition-colors duration-150 ease-out-quart",
				className,
			)}
		>
			<span className="mr-1.5">{isPlaying ? "■" : "▶"}</span>
			{isPlaying
				? "Stop listening..."
				: useCustomVoice
					? "Listen (AI)"
					: "Listen to lesson"}
		</Button>
	);
}