"use client";

import {
	UndoIcon,
	CheckmarkCircle01Icon,
	Mic01Icon,
	MicOff01Icon,
	MailSend01Icon,
	PauseFreeIcons,
	PlayFreeIcons,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { LiveWaveform } from "@/components/ui/live-waveform";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { cn } from "@/lib/shared";

interface VoiceRecorderProps {
	onRecordingComplete?: (audioBlob: Blob | null) => void;
	className?: string;
}

export function VoiceRecorder({
	onRecordingComplete,
	className,
}: VoiceRecorderProps) {
	const [isPaperPlaneing, setIsPaperPlaneing] = useState(false);
	const [sendSuccess, setPaperPlaneSuccess] = useState(false);

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

		setIsPaperPlaneing(true);

		setTimeout(() => {
			setIsPaperPlaneing(false);
			setPaperPlaneSuccess(true);

			setTimeout(() => {
				setPaperPlaneSuccess(false);
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
					barColor="oklch(76.7% 0.179 65°)"
					height={64}
					barWidth={3}
					barGap={2}
					fadeEdges
					className={cn(
						"w-full transition-transform duration-300",
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
						"text-xs uppercase tracking-widest font-medium transition-colors duration-200",
						sendSuccess
							? "text-success dark:text-success-foreground"
							: isRecording
								? "text-destructive animate-pulse"
								: isPlaying
									? "text-[--system-accent] animate-pulse"
									: showPermissionError
										? "text-destructive"
										: "text-muted-foreground",
					)}
				>
					{showPermissionError ? "Permission Required" : getStatusText()}
				</span>
				{(isRecording || isPlaying || (audioBlob && totalDuration > 0)) && (
					<span className="text-2xl font-mono font-extrabold tabular-nums text-foreground animate-fade-in-up">
						{getTimerDisplay()}
					</span>
				)}
			</div>

			<div className="flex items-center gap-4">
				<Button
					variant="ghost"
					size="icon"
					onClick={resetRecording}
					disabled={(!audioBlob && !isRecording) || isPaperPlaneing}
					className={cn(
						"rounded-lg",
						audioBlob || isRecording
							? "bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground hover:scale-105"
							: "bg-muted/30 text-muted-foreground/30",
						isPaperPlaneing && "opacity-50 pointer-events-none",
					)}
					aria-label="Reset recording"
				>
					<span className="transition-transform duration-200 active:rotate-180">
						<HugeiconsIcon icon={UndoIcon} className="h-4 w-4" />
					</span>
				</Button>

				<Button
					variant="ghost"
					onClick={handleRecordClick}
					disabled={isPaperPlaneing || showPermissionError}
					className={cn(
						"relative h-16 w-16 rounded-full",
						isRecording
							? "bg-destructive text-destructive-foreground shadow-[0_0_30px_oklch(59.3%_0.194_28°_/_0.6)]"
							: showPermissionError
								? "bg-muted text-muted-foreground cursor-not-allowed"
								: "bg-foreground text-background hover:scale-105 hover:shadow-xl hover:shadow-foreground/20",
						isPaperPlaneing && "opacity-50 pointer-events-none",
					)}
					aria-label={isRecording ? "Stop recording" : "Start recording"}
				>
					<span
						className={cn(
							"absolute inset-0 rounded-full transition-opacity duration-300",
							isRecording
								? "animate-ping bg-destructive/40"
								: "ring-2 ring-transparent",
						)}
					/>
					<span className="relative flex items-center justify-center">
						<HugeiconsIcon
							icon={MicOff01Icon}
							className="absolute h-6 w-6 transition-[opacity,transform] duration-200"
							style={{
								opacity: isRecording ? 1 : 0,
								transform: `scale(${isRecording ? 1 : 0.25})`,
								transitionTimingFunction: "cubic-bezier(0.2, 0, 0, 1)",
							}}
						/>
						<HugeiconsIcon
							icon={Mic01Icon}
							className="h-6 w-6 transition-[opacity,transform] duration-200"
							style={{
								opacity: isRecording ? 0 : 1,
								transform: `scale(${isRecording ? 0.25 : 1})`,
								transitionTimingFunction: "cubic-bezier(0.2, 0, 0, 1)",
							}}
						/>
					</span>
				</Button>

				<Button
					variant="ghost"
					size="icon"
					onClick={togglePlayback}
					disabled={!audioBlob || isRecording || isPaperPlaneing}
					className={cn(
						"rounded-lg",
						audioBlob && !isRecording
							? "bg-[--system-accent] text-background hover:scale-105 hover:shadow-xl hover:shadow-[--system-accent]/20"
							: "bg-muted/30 text-muted-foreground/30",
						isPaperPlaneing && "opacity-50 pointer-events-none",
					)}
					aria-label={isPlaying ? "Pause playback" : "Play recording"}
				>
					<span className="relative flex items-center justify-center">
						<HugeiconsIcon
							icon={PauseFreeIcons}
							className="absolute h-4 w-4 transition-[opacity,transform] duration-200"
							style={{
								opacity: isPlaying ? 1 : 0,
								transform: `scale(${isPlaying ? 1 : 0.25})`,
								transitionTimingFunction: "cubic-bezier(0.2, 0, 0, 1)",
							}}
						/>
						<HugeiconsIcon
							icon={PlayFreeIcons}
							className="h-4 w-4 ml-0.5 transition-[opacity,transform] duration-200"
							style={{
								opacity: isPlaying ? 0 : 1,
								transform: `scale(${isPlaying ? 0.25 : 1})`,
								transitionTimingFunction: "cubic-bezier(0.2, 0, 0, 1)",
							}}
						/>
					</span>
				</Button>
			</div>

			<Button
				onClick={handleSend}
				disabled={
					isRecording ||
					!audioBlob ||
					isPaperPlaneing ||
					sendSuccess ||
					isTooShort ||
					isTooLong
				}
				className={cn(
					"mt-2 w-full rounded-lg",
					sendSuccess
						? "bg-success text-primary-foreground hover:bg-success/90"
						: !isRecording && audioBlob && !isTooShort && !isTooLong
							? "bg-[--system-accent] text-background hover:opacity-90"
							: "bg-muted/50 text-muted-foreground/50",
				)}
				aria-label="Send voice message"
			>
				<span className="flex items-center gap-2">
					<AnimatePresence mode="wait" initial={false}>
						{sendSuccess ? (
							<motion.span
								key="success"
								className="flex items-center gap-2"
								initial={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
								animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
								exit={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
								transition={{ type: "spring", duration: 0.3, bounce: 0 }}
							>
								<HugeiconsIcon
									icon={CheckmarkCircle01Icon}
									className="h-4 w-4"
								/>
								<span>Sent!</span>
							</motion.span>
						) : isPaperPlaneing ? (
							<motion.span
								key="sending"
								className="flex items-center gap-2"
								initial={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
								animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
								exit={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
								transition={{ type: "spring", duration: 0.3, bounce: 0 }}
							>
								<span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
								<span>Sending...</span>
							</motion.span>
						) : (
							<motion.span
								key="idle"
								className="flex items-center gap-2"
								initial={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
								animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
								exit={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
								transition={{ type: "spring", duration: 0.3, bounce: 0 }}
							>
								<HugeiconsIcon icon={MailSend01Icon} className="h-4 w-4" />
								<span>Send Voice Message</span>
							</motion.span>
						)}
					</AnimatePresence>
				</span>
			</Button>
		</div>
	);
}
