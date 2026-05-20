"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface UseAudioRecorderReturn {
	isRecording: boolean;
	isPlaying: boolean;
	audioBlob: Blob | null;
	duration: number;
	playbackPosition: number;
	totalDuration: number;
	permissionStatus: "prompt" | "granted" | "denied" | "unsupported";
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

	const [isRecording, setIsRecording] = useState(false);
	const [isPlaying, setIsPlaying] = useState(false);
	const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
	const [duration, setDuration] = useState(0);
	const [playbackPosition, setPlaybackPosition] = useState(0);
	const [totalDuration, setTotalDuration] = useState(0);
	const [permissionStatus, setPermissionStatus] = useState<
		"prompt" | "granted" | "denied" | "unsupported"
	>("prompt");
	const [recordingError, setRecordingError] = useState<string | null>(null);

	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const audioChunksRef = useRef<Blob[]>([]);
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const totalDurationRef = useRef(0);

	const isTooShort =
		!isRecording && audioBlob !== null && duration < minDuration;
	const isTooLong = duration >= maxDuration;

	const checkBrowserSupport = useCallback(() => {
		if (!navigator.mediaDevices?.getUserMedia) {
			setPermissionStatus("unsupported");
			setRecordingError("Your browser doesn't support audio recording");
			return false;
		}
		return true;
	}, []);

	const requestPermission = useCallback(async (): Promise<boolean> => {
		if (!checkBrowserSupport()) return false;

		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			stream.getTracks().forEach((track) => { track.stop(); });
			setPermissionStatus("granted");
			setRecordingError(null);
			return true;
		} catch (error) {
			const err = error as Error;
			if (
				err.name === "NotAllowedError" ||
				err.name === "PermissionDeniedError"
			) {
				setPermissionStatus("denied");
				setRecordingError(
					"Microphone access denied. Please enable it in your browser settings.",
				);
			} else {
				setPermissionStatus("denied");
				setRecordingError(`Failed to access microphone: ${err.message}`);
			}
			return false;
		}
	}, [checkBrowserSupport]);

	useEffect(() => {
		return () => {
			if (timerRef.current) clearInterval(timerRef.current);
			if (audioRef.current) {
				audioRef.current.pause();
				audioRef.current = null;
			}
		};
	}, []);

	const resetRecording = useCallback(() => {
		if (audioRef.current) {
			audioRef.current.pause();
			audioRef.current = null;
		}
		setAudioBlob(null);
		setIsPlaying(false);
		setDuration(0);
		setPlaybackPosition(0);
		setTotalDuration(0);
		totalDurationRef.current = 0;
		onRecordingComplete?.(null);
	}, [onRecordingComplete]);

	const toggleRecording = useCallback(async () => {
		if (isRecording) {
			if (duration < minDuration) {
				setRecordingError(
					`Recording too short. Minimum ${minDuration} seconds required.`,
				);
				resetRecording();
				return;
			}

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
			if (!checkBrowserSupport()) return;

			try {
				const stream = await navigator.mediaDevices.getUserMedia({
					audio: true,
				});
				setPermissionStatus("granted");
				setRecordingError(null);

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
					setTotalDuration(duration);
					onRecordingComplete?.(blob);
					stream.getTracks().forEach((track) => { track.stop(); });
				};

				mediaRecorder.start(100);
				setIsRecording(true);
				setDuration(0);
				setAudioBlob(null);

				timerRef.current = setInterval(() => {
					setDuration((prev) => {
						if (prev >= maxDuration - 1) {
							if (
								mediaRecorderRef.current &&
								mediaRecorderRef.current.state === "recording"
							) {
								mediaRecorderRef.current.stop();
							}
							setRecordingError(
								`Maximum recording time (${maxDuration}s) reached.`,
							);
							return prev;
						}
						return prev + 1;
					});
				}, 1000);
			} catch (error) {
				const err = error as Error;
				if (
					err.name === "NotAllowedError" ||
					err.name === "PermissionDeniedError"
				) {
					setPermissionStatus("denied");
					setRecordingError(
						"Microphone access denied. Please enable it in your browser settings.",
					);
				} else {
					setRecordingError(`Failed to start recording: ${err.message}`);
				}
				console.error("Failed to start recording:", error);
			}
		}
	}, [
		isRecording,
		onRecordingComplete,
		duration,
		minDuration,
		maxDuration,
		checkBrowserSupport,
		resetRecording,
	]);

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

	return {
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
	};
}
