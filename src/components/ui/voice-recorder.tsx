"use client";

import {
	Check,
	Mic,
	MicOff,
	Pause,
	Play,
	RotateCcw,
	SendHorizontal,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { LiveWaveform } from "@/components/ui/live-waveform";
import { cn } from "@/lib/utils";

interface VoiceRecorderProps {
	onRecordingComplete?: (audioBlob: Blob | null) => void;
	className?: string;
}

export function VoiceRecorder({
	onRecordingComplete,
	className,
}: VoiceRecorderProps) {
	const [isRecording, setIsRecording] = useState(false);
	const [isPlaying, setIsPlaying] = useState(false);
	const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
	const [duration, setDuration] = useState(0);
	const [playbackPosition, setPlaybackPosition] = useState(0);
	const [isSending, setIsSending] = useState(false);
	const [sendSuccess, setSendSuccess] = useState(false);

	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const audioChunksRef = useRef<Blob[]>([]);
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const timerRef = useRef<NodeJS.Timeout | null>(null);
	const totalDurationRef = useRef(0);

	useEffect(() => {
		return () => {
			if (timerRef.current) clearInterval(timerRef.current);
			if (audioRef.current) {
				audioRef.current.pause();
				audioRef.current = null;
			}
		};
	}, []);

	const toggleRecording = useCallback(async () => {
		if (isRecording) {
			if (
				mediaRecorderRef.current &&
				mediaRecorderRef.current.state === "recording"
			) {
				mediaRecorderRef.current.stop();
			}
			if (timerRef.current) {
				clearInterval(timerRef.current);
				timerRef.current = null;
			}
			setIsRecording(false);
		} else {
			try {
				const stream = await navigator.mediaDevices.getUserMedia({
					audio: true,
				});
				const mediaRecorder = new MediaRecorder(stream);
				mediaRecorderRef.current = mediaRecorder;
				audioChunksRef.current = [];

				mediaRecorder.ondataavailable = (event) => {
					if (event.data.size > 0) {
						audioChunksRef.current.push(event.data);
					}
				};

				mediaRecorder.onstop = () => {
					const blob = new Blob(audioChunksRef.current, {
						type: "audio/webm",
					});
					setAudioBlob(blob);
					totalDurationRef.current = duration;
					onRecordingComplete?.(blob);
					stream.getTracks().forEach((track) => track.stop());
				};

				mediaRecorder.start(100);
				setIsRecording(true);
				setDuration(0);

				timerRef.current = setInterval(() => {
					setDuration((prev) => prev + 1);
				}, 1000);
			} catch (error) {
				console.error("Failed to start recording:", error);
			}
		}
	}, [isRecording, onRecordingComplete, duration]);

	const togglePlayback = useCallback(() => {
		if (!audioBlob) return;

		if (!audioRef.current) {
			audioRef.current = new Audio(URL.createObjectURL(audioBlob));
			audioRef.current.onended = () => {
				setIsPlaying(false);
				setPlaybackPosition(0);
			};
			audioRef.current.ontimeupdate = () => {
				setPlaybackPosition(audioRef.current?.currentTime || 0);
			};
		}

		if (isPlaying) {
			audioRef.current.pause();
			setIsPlaying(false);
		} else {
			audioRef.current.play();
			setIsPlaying(true);
		}
	}, [audioBlob, isPlaying]);

	const resetRecording = useCallback(() => {
		if (audioRef.current) {
			audioRef.current.pause();
			audioRef.current = null;
		}
		setAudioBlob(null);
		setIsPlaying(false);
		setDuration(0);
		setPlaybackPosition(0);
		totalDurationRef.current = 0;
		onRecordingComplete?.(null);
	}, [onRecordingComplete]);

	const handleSend = useCallback(() => {
		if (!audioBlob || isRecording) return;

		setIsSending(true);

		setTimeout(() => {
			setIsSending(false);
			setSendSuccess(true);

			setTimeout(() => {
				setSendSuccess(false);
				resetRecording();
			}, 800);
		}, 600);
	}, [audioBlob, isRecording, resetRecording]);

	const formatTime = (seconds: number) => {
		const mins = Math.floor(Math.abs(seconds) / 60);
		const secs = Math.floor(Math.abs(seconds) % 60);
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	const getStatusText = () => {
		if (sendSuccess) return "Sent!";
		if (isRecording) return "Recording";
		if (isPlaying) {
			const remaining = Math.floor(totalDurationRef.current - playbackPosition);
			return `Playing ${formatTime(remaining)}`;
		}
		if (audioBlob) return "Recorded";
		return "Ready";
	};

	const getTimerDisplay = () => {
		if (sendSuccess) return null;
		if (isRecording) return formatTime(duration);
		if (isPlaying) {
			return formatTime(
				Math.floor(totalDurationRef.current - playbackPosition),
			);
		}
		if (audioBlob && totalDurationRef.current > 0) {
			return formatTime(totalDurationRef.current);
		}
		return null;
	};

	return (
		<div className={cn("flex flex-col items-center gap-6 w-full", className)}>
			<div className="w-full relative overflow-hidden rounded-lg bg-muted/20 p-2">
				<LiveWaveform
					active={isRecording}
					processing={!isRecording && !audioBlob}
					mode="static"
					barColor="#FFA500"
					height={64}
					barWidth={3}
					barGap={2}
					fadeEdges
					className={cn(
						"w-full transition-all duration-300",
						isRecording && "scale-y-110",
					)}
				/>
			</div>

			<div className="flex flex-col items-center gap-1 min-h-[3.5rem]">
				<span
					className={cn(
						"text-xs uppercase tracking-widest font-medium transition-all duration-200",
						sendSuccess
							? "text-green-500"
							: isRecording
								? "text-destructive animate-pulse"
								: isPlaying
									? "text-primary animate-pulse"
									: "text-muted-foreground",
					)}
				>
					{getStatusText()}
				</span>
				{(isRecording ||
					isPlaying ||
					(audioBlob && totalDurationRef.current > 0)) && (
					<span className="text-2xl font-mono font-bold tabular-nums text-foreground animate-fade-in-up">
						{getTimerDisplay()}
					</span>
				)}
			</div>

			<div className="flex items-center gap-4">
				<button
					onClick={resetRecording}
					disabled={(!audioBlob && !isRecording) || isSending}
					className={cn(
						"flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 active:scale-95",
						audioBlob || isRecording
							? "bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground hover:scale-105"
							: "bg-muted/30 text-muted-foreground/30 cursor-not-allowed",
						isSending && "opacity-50 pointer-events-none",
					)}
					aria-label="Reset recording"
				>
					<span className="transition-transform duration-200 active:rotate-180">
						<RotateCcw className="h-4 w-4" />
					</span>
				</button>

				<button
					onClick={toggleRecording}
					disabled={isSending}
					className={cn(
						"relative flex h-16 w-16 items-center justify-center rounded-full transition-all duration-200 active:scale-95",
						isRecording
							? "bg-destructive text-destructive-foreground shadow-[0_0_30px_rgba(239,68,68,0.6)]"
							: "bg-foreground text-background hover:scale-105 hover:shadow-xl hover:shadow-foreground/20",
						isSending && "opacity-50 pointer-events-none",
					)}
					aria-label={isRecording ? "Stop recording" : "Start recording"}
				>
					<span
						className={cn(
							"absolute inset-0 rounded-full transition-all duration-300",
							isRecording
								? "animate-ping bg-destructive/40"
								: "ring-2 ring-transparent",
						)}
					/>
					<span
						className={cn(
							"relative flex items-center justify-center transition-transform duration-200",
							isRecording && "scale-90",
						)}
					>
						{isRecording ? (
							<MicOff className="h-6 w-6" />
						) : (
							<Mic className="h-6 w-6" />
						)}
					</span>
				</button>

				<button
					onClick={togglePlayback}
					disabled={!audioBlob || isRecording || isSending}
					className={cn(
						"flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 active:scale-95",
						audioBlob && !isRecording
							? "bg-primary text-primary-foreground hover:scale-105 hover:shadow-xl hover:shadow-primary/20"
							: "bg-muted/30 text-muted-foreground/30 cursor-not-allowed",
						isSending && "opacity-50 pointer-events-none",
					)}
					aria-label={isPlaying ? "Pause playback" : "Play recording"}
				>
					<span
						className={cn(
							"transition-transform duration-200",
							isPlaying && "scale-90",
						)}
					>
						{isPlaying ? (
							<Pause className="h-4 w-4" />
						) : (
							<Play className="h-4 w-4 ml-0.5" />
						)}
					</span>
				</button>
			</div>

			<button
				onClick={handleSend}
				disabled={isRecording || !audioBlob || isSending || sendSuccess}
				className={cn(
					"mt-2 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 active:scale-[0.98]",
					sendSuccess
						? "bg-green-500 text-white"
						: !isRecording && audioBlob
							? "bg-primary text-primary-foreground hover:opacity-90 hover:scale-[1.02] hover:shadow-lg"
							: "bg-muted/50 text-muted-foreground/50 cursor-not-allowed",
				)}
				aria-label="Send voice message"
			>
				{sendSuccess ? (
					<span className="flex items-center gap-2">
						<Check className="h-4 w-4 animate-checkmark" />
						<span>Sent!</span>
					</span>
				) : isSending ? (
					<span className="flex items-center gap-2">
						<span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
						<span>Sending...</span>
					</span>
				) : (
					<span className="flex items-center gap-2">
						<SendHorizontal className="h-4 w-4" />
						<span>Send Voice Message</span>
					</span>
				)}
			</button>
		</div>
	);
}
