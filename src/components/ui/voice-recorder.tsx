"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { cn } from "@/lib/shared";
import { ControlButtons } from "./voice-recorder/control-buttons";
import { SendButton } from "./voice-recorder/send-button";
import { StatusDisplay } from "./voice-recorder/status-display";
import { WaveformDisplay } from "./voice-recorder/waveform-display";

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
		return () => {
			sendTimers.current.forEach(clearTimeout);
			sendTimers.current = [];
		};
	}, []);

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
			className={cn("mt-4 flex w-full flex-col items-center gap-6", className)}
		>
			<WaveformDisplay isRecording={isRecording} audioBlob={audioBlob} />

			<StatusDisplay
				sendSuccess={sendSuccess}
				isRecording={isRecording}
				isPlaying={isPlaying}
				showPermissionError={showPermissionError}
				showValidationError={showValidationError}
				isTooShort={isTooShort}
				isTooLong={isTooLong}
				recordingError={recordingError}
				statusText={getStatusText()}
				timerDisplay={getTimerDisplay()}
			/>

			<ControlButtons
				isRecording={isRecording}
				isPlaying={isPlaying}
				audioBlob={audioBlob}
				isPaperPlaneing={isPaperPlaneing}
				showPermissionError={showPermissionError}
				disabled={isPaperPlaneing || showPermissionError}
				onReset={resetRecording}
				onRecordClick={handleRecordClick}
				onTogglePlayback={togglePlayback}
			/>

			<SendButton
				isRecording={isRecording}
				audioBlob={audioBlob}
				isPaperPlaneing={isPaperPlaneing}
				sendSuccess={sendSuccess}
				isTooShort={isTooShort}
				isTooLong={isTooLong}
				onSend={handleSend}
			/>
		</div>
	);
}
