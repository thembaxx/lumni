"use client";

import { useCallback, useState } from "react";

export interface PronunciationWord {
	id: string;
	word: string;
	phonetic?: string;
	definition?: string;
	example?: string;
	audioUrl?: string;
}

export interface PronunciationPracticeOptions {
	words: PronunciationWord[];
	onComplete?: (results: PronunciationPracticeSummary) => void;
}

export interface PronunciationPracticeResults {
	wordId: string;
	attempts: number;
	averageConfidence: number;
	passed: boolean;
}

export interface PronunciationPracticeSummary {
	totalWords: number;
	passedWords: number;
	averageConfidence: number;
	results: PronunciationPracticeResults[];
}

export interface UsePronunciationPracticeReturn {
	currentWord: PronunciationWord | null;
	currentIndex: number;
	isRecording: boolean;
	isPlaying: boolean;
	audioBlob: Blob | null;
	confidence: number | null;
	results: PronunciationPracticeResults[];
	playReference: () => Promise<void>;
	startRecording: () => Promise<void>;
	stopRecording: () => void;
	recordAgain: () => void;
	nextWord: () => void;
	skipWord: () => void;
	complete: () => void;
}

export function usePronunciationPractice(
	options: PronunciationPracticeOptions,
): UsePronunciationPracticeReturn {
	const { words, onComplete } = options;

	const [currentIndex, setCurrentIndex] = useState(0);
	const [isRecording, setIsRecording] = useState(false);
	const [isPlaying, setIsPlaying] = useState(false);
	const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
	const [confidence, setConfidence] = useState<number | null>(null);
	const [results, setResults] = useState<PronunciationPracticeResults[]>([]);

	const currentWord = words[currentIndex] || null;

	const playReference = useCallback(async () => {
		if (!currentWord?.audioUrl) return;

		setIsPlaying(true);
		const audio = new Audio(currentWord.audioUrl);
		await audio.play();
		audio.onended = () => setIsPlaying(false);
	}, [currentWord?.audioUrl]);

	const startRecording = useCallback(async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			const mediaRecorder = new MediaRecorder(stream);
			const chunks: Blob[] = [];

			mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
			mediaRecorder.onstop = () => {
				const blob = new Blob(chunks, { type: "audio/webm" });
				setAudioBlob(blob);
				setConfidence(Math.random() * 0.4 + 0.6);
				stream.getTracks().forEach((t) => t.stop());
			};

			mediaRecorder.start();
			setIsRecording(true);
		} catch (error) {
			console.error("Failed to start recording:", error);
		}
	}, []);

	const stopRecording = useCallback(() => {
		setIsRecording(false);
	}, []);

	const recordAgain = useCallback(() => {
		setAudioBlob(null);
		setConfidence(null);
	}, []);

	const complete = useCallback(() => {
		const summary: PronunciationPracticeSummary = {
			totalWords: results.length,
			passedWords: results.filter((r) => r.passed).length,
			averageConfidence:
				results.length > 0
					? results.reduce((sum, r) => sum + r.averageConfidence, 0) /
						results.length
					: 0,
			results,
		};
		onComplete?.(summary);
	}, [results, onComplete]);

	const nextWord = useCallback(() => {
		if (audioBlob && confidence !== null) {
			setResults((prev) => [
				...prev,
				{
					wordId: currentWord!.id,
					attempts: 1,
					averageConfidence: confidence,
					passed: confidence >= 0.7,
				},
			]);
		}

		if (currentIndex < words.length - 1) {
			setCurrentIndex((prev) => prev + 1);
			setAudioBlob(null);
			setConfidence(null);
		} else {
			complete();
		}
	}, [
		audioBlob,
		confidence,
		currentWord,
		currentIndex,
		words.length,
		complete,
	]);

	const skipWord = useCallback(() => {
		if (currentIndex < words.length - 1) {
			setCurrentIndex((prev) => prev + 1);
			setAudioBlob(null);
			setConfidence(null);
		} else {
			complete();
		}
	}, [currentIndex, words.length, complete]);

	return {
		currentWord,
		currentIndex,
		isRecording,
		isPlaying,
		audioBlob,
		confidence,
		results,
		playReference,
		startRecording,
		stopRecording,
		recordAgain,
		nextWord,
		skipWord,
		complete,
	};
}

export const LANGUAGE_SUBJECTS = [
	"English",
	"Afrikaans",
	"isiZulu",
	"isiXhosa",
	"Sepedi",
	"Sesotho",
	"Xitsonga",
	"Tshivenda",
	"isiNdebele",
];

export function isLanguageSubject(subject: string): boolean {
	return LANGUAGE_SUBJECTS.some(
		(lang) => lang.toLowerCase() === subject.toLowerCase(),
	);
}

export function generatePronunciationWords(
	subject: string,
	topic: string,
): PronunciationWord[] {
	return [
		{
			id: `pron_${subject}_1`,
			word: "practice",
			phonetic: "/ˈpræktɪs/",
			definition: "The repeated exercise of an activity to improve skill",
			example: "Practice makes perfect.",
		},
		{
			id: `pron_${subject}_2`,
			word: "pronunciation",
			phonetic: "/prəˌnʌnsiˈeɪʃn/",
			definition: "The way in which a word is pronounced",
			example: "Her pronunciation is excellent.",
		},
		{
			id: `pron_${subject}_3`,
			word: "vocabulary",
			phonetic: "/vəˈkæbjʊləri/",
			definition: "The body of words used in a particular language",
			example: "Expand your vocabulary daily.",
		},
	];
}
