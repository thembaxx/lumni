"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff, Pause, Play, RotateCcw, SendHorizontal } from "lucide-react";
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

	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const audioChunksRef = useRef<Blob[]>([]);
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const timerRef = useRef<NodeJS.Timeout | null>(null);
	const playbackTimerRef = useRef<NodeJS.Timeout | null>(null);
	const totalDurationRef = useRef(0);

	useEffect(() => {
		return () => {
			if (timerRef.current) clearInterval(timerRef.current);
			if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
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
					const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
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
			if (playbackTimerRef.current) {
				clearInterval(playbackTimerRef.current);
				playbackTimerRef.current = null;
			}
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
		if (playbackTimerRef.current) {
			clearInterval(playbackTimerRef.current);
			playbackTimerRef.current = null;
		}
		setAudioBlob(null);
		setIsPlaying(false);
		setDuration(0);
		setPlaybackPosition(0);
		totalDurationRef.current = 0;
		onRecordingComplete?.(null);
	}, [onRecordingComplete]);

	const formatTime = (seconds: number) => {
		const mins = Math.floor(Math.abs(seconds) / 60);
		const secs = Math.floor(Math.abs(seconds) % 60);
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	const getStatusText = () => {
		if (isRecording) {
			return "Recording";
		}
		if (isPlaying) {
			const remaining = Math.floor(totalDurationRef.current - playbackPosition);
			return `Playing ${formatTime(remaining)}`;
		}
		if (audioBlob) {
			return "Recorded";
		}
		return "Ready";
	};

	const getTimerDisplay = () => {
		if (isRecording) {
			return formatTime(duration);
		}
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
		<div className={cn("flex flex-col items-center gap-6", className)}>
			<div className="w-full relative">
				<LiveWaveform
					active={isRecording}
					processing={!isRecording && !audioBlob}
					mode="static"
					barColor="#FFA500"
					height={80}
					barWidth={3}
					barGap={2}
					fadeEdges
					className="w-full dark:text-white/80"
				/>
			</div>

			<div className="flex flex-col items-center gap-1">
				<span
					className={cn(
						"text-xs uppercase tracking-widest font-medium",
						isRecording
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
					<span className="text-2xl font-mono font-bold tabular-nums text-foreground">
						{getTimerDisplay()}
					</span>
				)}
			</div>

			<div className="flex items-center gap-4">
				<button
					onClick={resetRecording}
					disabled={!audioBlob && !isRecording}
					className={cn(
						"flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200",
						audioBlob || isRecording
							? "bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground"
							: "bg-muted/30 text-muted-foreground/30 cursor-not-allowed",
					)}
					aria-label="Reset recording"
				>
					<RotateCcw className="h-4 w-4" />
				</button>

				<button
					onClick={toggleRecording}
					className={cn(
						"relative flex h-16 w-16 items-center justify-center rounded-full transition-all duration-300",
						isRecording
							? "bg-destructive text-destructive-foreground shadow-[0_0_30px_rgba(239,68,68,0.6)] scale-105"
							: "bg-foreground text-background hover:scale-105 hover:shadow-lg hover:shadow-foreground/20",
					)}
					aria-label={isRecording ? "Stop recording" : "Start recording"}
				>
					<span
						className={cn(
							"absolute inset-0 rounded-full",
							isRecording
								? "animate-ping bg-destructive/50"
								: "animate-pulse ring-2 ring-foreground/10",
						)}
					/>
					<div className="relative">
						{isRecording ? (
							<MicOff className="h-6 w-6" />
						) : (
							<Mic className="h-6 w-6" />
						)}
					</div>
				</button>

<button
          onClick={togglePlayback}
          disabled={!audioBlob}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200",
            audioBlob && !isRecording
              ? "bg-primary text-primary-foreground hover:scale-105 hover:shadow-lg hover:shadow-primary/20"
              : "bg-muted/30 text-muted-foreground/30 cursor-not-allowed"
          )}
          aria-label={isPlaying ? "Pause playback" : "Play recording"}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4 ml-0.5" />
          )}
        </button>
      </div>

      <button
        onClick={() => {
          onRecordingComplete?.(audioBlob);
          resetRecording();
        }}
        disabled={isRecording || !audioBlob}
        className={cn(
          "mt-2 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200",
          !isRecording && audioBlob
            ? "bg-primary text-primary-foreground hover:opacity-90"
            : "bg-muted/50 text-muted-foreground/50 cursor-not-allowed"
        )}
        aria-label="Send voice message"
      >
        <SendHorizontal className="h-4 w-4" />
        Send Voice Message
      </button>
    </div>
  );
}
