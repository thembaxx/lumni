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
import { useCallback, useState } from "react";
import { LiveWaveform } from "@/components/ui/live-waveform";
import { useAudioRecorder } from "@/lib/hooks/use-audio-recorder";
import { cn } from "@/lib/utils";

interface VoiceRecorderProps {
	onRecordingComplete?: (audioBlob: Blob | null) => void;
	className?: string;
}

export function VoiceRecorder({
	onRecordingComplete,
	className,
}: VoiceRecorderProps) {
	const [isSending, setIsSending] = useState(false);
	const [sendSuccess, setSendSuccess] = useState(false);

	const {
		isRecording,
		isPlaying,
		audioBlob,
		duration,
		playbackPosition,
		totalDuration,
		permissionStatus,
		recordingError,
		isTooShort,
		isTooLong,
		toggleRecording,
		togglePlayback,
		resetRecording,
		requestPermission,
	} = useAudioRecorder({ onRecordingComplete });

	const showPermissionError =
		permissionStatus === "denied" || permissionStatus === "unsupported";
	const showValidationError =
		isTooShort || isTooLong || (recordingError && !isRecording);

	const handleRecordClick = async () => {
		if (permissionStatus === "prompt") {
			const granted = await requestPermission();
			if (!granted) return;
		}
		toggleRecording();
	};

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
			const remaining = Math.floor(totalDuration - playbackPosition);
			return `Playing ${formatTime(remaining)}`;
		}
		if (audioBlob) return "Recorded";
		return "Ready";
	};

	const getTimerDisplay = () => {
		if (sendSuccess) return null;
		if (isRecording) return formatTime(duration);
		if (isPlaying) {
			return formatTime(Math.floor(totalDuration - playbackPosition));
		}
		if (audioBlob && totalDuration > 0) {
			return formatTime(totalDuration);
		}
		return null;
	};

	return (
		<div
			className={cn("flex flex-col items-center gap-6 w-full mt-4", className)}
		>
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

			<div className="flex flex-col items-center gap-1 min-h-14">
				{showValidationError && (
					<span className="text-xs text-destructive animate-fade-in-up">
						{isTooShort && `Recording too short (min 1s)`}
						{isTooLong && "Maximum duration reached"}
						{recordingError && !isTooShort && !isTooLong && recordingError}
					</span>
				)}
				<span
					className={cn(
						"text-xs uppercase tracking-widest font-medium transition-all duration-200",
						sendSuccess
							? "text-green-500"
							: isRecording
								? "text-destructive animate-pulse"
								: isPlaying
									? "text-primary animate-pulse"
									: showPermissionError
										? "text-destructive"
										: "text-muted-foreground",
					)}
				>
					{showPermissionError ? "Permission Required" : getStatusText()}
				</span>
				{(isRecording || isPlaying || (audioBlob && totalDuration > 0)) && (
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
						"flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200 active:scale-95",
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
					onClick={handleRecordClick}
					disabled={isSending || showPermissionError}
					className={cn(
						"relative flex h-16 w-16 items-center justify-center rounded-full transition-all duration-200 active:scale-95",
						isRecording
							? "bg-destructive text-destructive-foreground shadow-[0_0_30px_rgba(239,68,68,0.6)]"
							: showPermissionError
								? "bg-muted text-muted-foreground cursor-not-allowed"
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
						"flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200 active:scale-95",
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
				disabled={
					isRecording ||
					!audioBlob ||
					isSending ||
					sendSuccess ||
					isTooShort ||
					isTooLong
				}
				className={cn(
					"mt-2 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 active:scale-[0.98]",
					sendSuccess
						? "bg-green-500 text-white"
						: !isRecording && audioBlob && !isTooShort && !isTooLong
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
