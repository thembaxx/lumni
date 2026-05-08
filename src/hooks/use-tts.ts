"use client";

import { useCallback, useEffect, useState } from "react";
import {
	getExercisesForLanguage,
	getLanguageForText,
	type PronunciationExercise,
	SUPPORTED_LANGUAGES,
	type TTSOptions,
	type TTSVoice,
	ttsService,
} from "@/lib/utils/tts-service";

export interface UseTTSReturn {
	isSupported: boolean;
	isSpeaking: boolean;
	isPaused: boolean;
	voices: TTSVoice[];
	speak: (text: string, options?: TTSOptions) => Promise<void>;
	pause: () => void;
	resume: () => void;
	stop: () => void;
	availableLanguages: typeof SUPPORTED_LANGUAGES;
	getExercises: (lang: string) => PronunciationExercise[];
}

export function useTTS(): UseTTSReturn {
	const [isSupported, setIsSupported] = useState(false);
	const [isSpeaking, setIsSpeaking] = useState(false);
	const [isPaused, setIsPaused] = useState(false);
	const [voices, setVoices] = useState<TTSVoice[]>([]);

	useEffect(() => {
		setIsSupported(ttsService.isSupported());

		const loadVoices = () => {
			setVoices(ttsService.getVoices());
		};

		loadVoices();

		if ("speechSynthesis" in window) {
			window.speechSynthesis.onvoiceschanged = loadVoices;
		}

		ttsService.onStart(() => {
			setIsSpeaking(true);
			setIsPaused(false);
		});

		ttsService.onEnd(() => {
			setIsSpeaking(false);
			setIsPaused(false);
		});

		ttsService.onError(() => {
			setIsSpeaking(false);
			setIsPaused(false);
		});
	}, []);

	const speak = useCallback(async (text: string, options?: TTSOptions) => {
		const lang = options?.lang || getLanguageForText(text);
		await ttsService.speak(text, { ...options, lang });
	}, []);

	const pause = useCallback(() => {
		ttsService.pause();
		setIsPaused(true);
	}, []);

	const resume = useCallback(() => {
		ttsService.resume();
		setIsPaused(false);
	}, []);

	const stop = useCallback(() => {
		ttsService.cancel();
		setIsSpeaking(false);
		setIsPaused(false);
	}, []);

	const getExercises = useCallback((lang: string): PronunciationExercise[] => {
		return getExercisesForLanguage(lang);
	}, []);

	return {
		isSupported,
		isSpeaking,
		isPaused,
		voices,
		speak,
		pause,
		resume,
		stop,
		availableLanguages: SUPPORTED_LANGUAGES,
		getExercises,
	};
}

interface MediaRecorderWithInterval extends MediaRecorder {
	_interval?: NodeJS.Timeout;
}

export function useVoiceRecorder() {
	const [isRecording, setIsRecording] = useState(false);
	const [mediaRecorder, setMediaRecorder] =
		useState<MediaRecorderWithInterval | null>(null);
	const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
	const [recordingTime, setRecordingTime] = useState(0);

	const startRecording = useCallback(async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			const recorder = new MediaRecorder(stream);
			const chunks: Blob[] = [];

			recorder.ondataavailable = (e) => {
				if (e.data.size > 0) {
					chunks.push(e.data);
				}
			};

			recorder.onstop = () => {
				const blob = new Blob(chunks, { type: "audio/webm" });
				setAudioBlob(blob);
				stream.getTracks().forEach((track) => track.stop());
			};

			recorder.start();
			setMediaRecorder(recorder);
			setIsRecording(true);
			setRecordingTime(0);

			const interval = setInterval(() => {
				setRecordingTime((t) => t + 1);
			}, 1000);

			(recorder as MediaRecorderWithInterval)._interval = interval;
		} catch (error) {
			console.error("Failed to start recording:", error);
		}
	}, []);

	const stopRecording = useCallback(() => {
		if (mediaRecorder && isRecording) {
			mediaRecorder.stop();
			setIsRecording(false);
			const interval = (mediaRecorder as MediaRecorderWithInterval)._interval;
			if (interval) clearInterval(interval);
		}
	}, [mediaRecorder, isRecording]);

	const clearRecording = useCallback(() => {
		setAudioBlob(null);
		setRecordingTime(0);
	}, []);

	return {
		isRecording,
		recordingTime,
		audioBlob,
		startRecording,
		stopRecording,
		clearRecording,
	};
}
