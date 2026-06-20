"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { cn } from "@/lib/utils";
import { ControlButtons } from "./voice-recorder/control-buttons";
import { SendButton } from "./voice-recorder/send-button";
import { StatusDisplay } from "./voice-recorder/status-display";
import { WaveformDisplay } from "./voice-recorder/waveform-display";

function deriveRecorderState(args: {
	isRecording: boolean;
	isPlaying: boolean;
	isPaperPlaneing: boolean;
	showPermissionError: boolean;
	audioBlob: Blob | null;
}):
	| "idle"
	| "recording"
	| "recorded"
	| "playing"
	| "sending"
	| "permission-denied" {
	if (args.showPermissionError) return "permission-denied";
	if (args.isPaperPlaneing) return "sending";
	if (args.isRecording) return "recording";
	if (args.isPlaying) return "playing";
	if (args.audioBlob) return "recorded";
	return "idle";
}

function deriveStatusDisplayMode(args: {
	sendSuccess: boolean;
	isRecording: boolean;
	isPlaying: boolean;
	showPermissionError: boolean;
	showValidationError: boolean;
}):
	| "idle"
	| "recording"
	| "playing"
	| "permission-denied"
	| "validation-error"
	| "success" {
	if (args.showPermissionError) return "permission-denied";
	if (args.showValidationError) return "validation-error";
	if (args.sendSuccess) return "success";
	if (args.isRecording) return "recording";
	if (args.isPlaying) return "playing";
	return "idle";
}

function deriveSendButtonState(args: {
	isRecording: boolean;
	isPaperPlaneing: boolean;
	sendSuccess: boolean;
	audioBlob: Blob | null;
}): "idle" | "recording" | "recorded" | "playing" | "sending" | "success" {
	if (args.sendSuccess) return "success";
	if (args.isPaperPlaneing) return "sending";
	if (args.isRecording) return "recording";
	if (args.audioBlob) return "recorded";
	return "idle";
}

interface VoiceRecorderProps {
	onRecordingComplete?: (audioBlob: Blob | null) => void;
	className?: string;
}

function formatRecordingTime(seconds: number): string {
	const mins = Math.floor(Math.abs(seconds) / 60);
	const secs = Math.floor(Math.abs(seconds) % 60);
	return `${mins}:${secs.toString().padStart(2, "0")}`;
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
	const showValidationError = !!(
		isTooShort ||
		isTooLong ||
		(recordingError && !isRecording)
	);

	const handleRecordClick = async () => {
		if (permissionStatus === "prompt") {
			const granted = await requestPermission();
			if (!granted) return;
		}
		toggleRecording();
	};

	const sendTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

	const handleSend = useCallback(() => {
		if (!audioBlob || isRecording) return;

		setIsPaperPlaneing(true);

		const t1 = setTimeout(() => {
			setIsPaperPlaneing(false);
			setPaperPlaneSuccess(true);

			const t2 = setTimeout(() => {
				setPaperPlaneSuccess(false);
				resetRecording();
			}, 800);
			sendTimers.current.push(t2);
		}, 600);
		sendTimers.current.push(t1);
	}, [audioBlob, isRecording, resetRecording]);

	// Cleanup timers on unmount
	useEffect(() => {
		const sendTimersAtMount = sendTimers.current;
		return () => {
			sendTimersAtMount.forEach(clearTimeout);
		};
	}, []);

	const formatTime = formatRecordingTime;

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
			className={cn("mt-4 flex w-full flex-col items-center gap-6", className)}
		>
			<WaveformDisplay isRecording={isRecording} audioBlob={audioBlob} />

			<StatusDisplay
				displayMode={deriveStatusDisplayMode({
					sendSuccess,
					isRecording,
					isPlaying,
					showPermissionError,
					showValidationError,
				})}
				isTooShort={isTooShort}
				isTooLong={isTooLong}
				recordingError={recordingError}
				statusText={getStatusText()}
				timerDisplay={getTimerDisplay()}
			/>

			<ControlButtons
				recorderState={deriveRecorderState({
					isRecording,
					isPlaying,
					isPaperPlaneing,
					showPermissionError,
					audioBlob,
				})}
				audioBlob={audioBlob}
				disabled={isPaperPlaneing || showPermissionError}
				onReset={resetRecording}
				onRecordClick={handleRecordClick}
				onTogglePlayback={togglePlayback}
			/>

			<SendButton
				recorderState={deriveSendButtonState({
					isRecording,
					isPaperPlaneing,
					sendSuccess,
					audioBlob,
				})}
				audioBlob={audioBlob}
				isTooShort={isTooShort}
				isTooLong={isTooLong}
				onSend={handleSend}
			/>
		</div>
	);
}
