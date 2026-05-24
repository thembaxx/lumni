"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { audioEngine } from "@/lib/audio-engine";
import type { AudioEngineState } from "@/lib/audio-engine";

export interface UseAudioRecorderReturn {
	isRecording: boolean;
	isPlaying: boolean;
	audioBlob: Blob | null;
	duration: number;
	playbackPosition: number;
	totalDuration: number;
	permissionStatus: AudioEngineState["permissionStatus"];
	recordingError: string | null;
	isTooShort: boolean;
	isTooLong: boolean;
	toggleRecording: () => Promise<void>;
	togglePlayback: () => void;
	resetRecording: () => void;
	requestPermission: () => Promise<boolean>;
}

interface UseAudioRecorderOptions {
	onRecordingComplete?: (blob: Blob | null) => void;
	minDuration?: number;
	maxDuration?: number;
}

export function useAudioRecorder(
	options: UseAudioRecorderOptions = {},
): UseAudioRecorderReturn {
	const { onRecordingComplete, minDuration = 1, maxDuration = 300 } = options;
	const [state, setState] = useState<AudioEngineState>(audioEngine.getState());
	const onCompleteRef = useRef(onRecordingComplete);
	onCompleteRef.current = onRecordingComplete;

	useEffect(() => {
		const unsubscribe = audioEngine.subscribe(() => {
			setState(audioEngine.getState());
		});
		return () => {
			unsubscribe();
			audioEngine.destroy();
		};
	}, []);

	const isTooShort =
		!state.isRecording &&
		state.audioBlob !== null &&
		state.duration < minDuration;
	const isTooLong = state.duration >= maxDuration;

	const requestPermission = useCallback(async (): Promise<boolean> => {
		const result = await audioEngine.requestPermission();
		return result;
	}, []);

	const toggleRecording = useCallback(async () => {
		if (state.isRecording) {
			if (state.duration < minDuration) {
				audioEngine.resetRecording();
				onCompleteRef.current?.(null);
				return;
			}
			audioEngine.stopRecording();
			const result = audioEngine.getRecordingResult();
			if (result) {
				onCompleteRef.current?.(result.blob);
			}
		} else {
			await audioEngine.startRecording();
		}
	}, [state.isRecording, state.duration, minDuration]);

	const togglePlayback = useCallback(() => {
		audioEngine.togglePlayback();
	}, []);

	const resetRecording = useCallback(() => {
		audioEngine.resetRecording();
		onCompleteRef.current?.(null);
	}, []);

	return {
		isRecording: state.isRecording,
		isPlaying: state.playbackState === "playing",
		audioBlob: state.audioBlob,
		duration: state.duration,
		playbackPosition: state.playbackPosition,
		totalDuration: state.totalDuration,
		permissionStatus: state.permissionStatus,
		recordingError: state.error,
		isTooShort,
		isTooLong,
		toggleRecording,
		togglePlayback,
		resetRecording,
		requestPermission,
	};
}
