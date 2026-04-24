"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface UseAudioRecorderReturn {
	isRecording: boolean;
	isPlaying: boolean;
	audioBlob: Blob | null;
	duration: number;
	playbackPosition: number;
	totalDuration: number;
	toggleRecording: () => Promise<void>;
	togglePlayback: () => void;
	resetRecording: () => void;
}

interface UseAudioRecorderOptions {
	onRecordingComplete?: (blob: Blob | null) => void;
}

export function useAudioRecorder(
	options: UseAudioRecorderOptions = {},
): UseAudioRecorderReturn {
	const { onRecordingComplete } = options;

	const [isRecording, setIsRecording] = useState(false);
	const [isPlaying, setIsPlaying] = useState(false);
	const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
	const [duration, setDuration] = useState(0);
	const [playbackPosition, setPlaybackPosition] = useState(0);
	const [totalDuration, setTotalDuration] = useState(0);

	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const audioChunksRef = useRef<Blob[]>([]);
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
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
					const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
					setAudioBlob(blob);
					totalDurationRef.current = duration;
					setTotalDuration(duration);
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
		setTotalDuration(0);
		totalDurationRef.current = 0;
		onRecordingComplete?.(null);
	}, [onRecordingComplete]);

	return {
		isRecording,
		isPlaying,
		audioBlob,
		duration,
		playbackPosition,
		totalDuration,
		toggleRecording,
		togglePlayback,
		resetRecording,
	};
}
