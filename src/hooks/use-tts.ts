"use client";

import { useCallback, useEffect, useState } from "react";
import { audioEngine } from "@/lib/audio-engine";
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

type TTSStatus = "idle" | "speaking" | "paused";

export function useTTS(): UseTTSReturn {
	const [isSupported] = useState(() => ttsService.isSupported());
	const [ttsStatus, setTtsStatus] = useState<TTSStatus>("idle");
	const [voices, setVoices] = useState<TTSVoice[]>(() =>
		ttsService.getVoices(),
	);

	const isSpeaking = ttsStatus === "speaking";
	const isPaused = ttsStatus === "paused";

	useEffect(() => {
		const loadVoices = () => {
			setVoices(ttsService.getVoices());
		};

		if ("speechSynthesis" in window) {
			window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
		}

		return () => {
			if ("speechSynthesis" in window) {
				window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
			}
		};
	}, []);

	useEffect(() => {
		const unsubStart = ttsService.onStart(() => setTtsStatus("speaking"));
		const unsubEnd = ttsService.onEnd(() => setTtsStatus("idle"));
		const unsubError = ttsService.onError(() => setTtsStatus("idle"));

		return () => {
			unsubStart();
			unsubEnd();
			unsubError();
		};
	}, []);

	const speak = useCallback(async (text: string, options?: TTSOptions) => {
		const lang = options?.lang || getLanguageForText(text);
		await ttsService.speak(text, { ...options, lang });
	}, []);

	const pause = useCallback(() => {
		ttsService.pause();
		setTtsStatus("paused");
	}, []);

	const resume = useCallback(() => {
		ttsService.resume();
		setTtsStatus("speaking");
	}, []);

	const stop = useCallback(() => {
		ttsService.cancel();
		setTtsStatus("idle");
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

export function useVoiceRecorder() {
	const [isRecording, setIsRecording] = useState(false);
	const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
	const [recordingTime, setRecordingTime] = useState(0);

	const startRecording = useCallback(async () => {
		await audioEngine.startRecording();
		setIsRecording(true);
		setRecordingTime(0);
	}, []);

	const stopRecording = useCallback(() => {
		audioEngine.stopRecording();
		setIsRecording(false);
		const result = audioEngine.getRecordingResult();
		if (result) {
			setAudioBlob(result.blob);
			setRecordingTime(result.duration);
		}
	}, []);

	const clearRecording = useCallback(() => {
		audioEngine.resetRecording();
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
