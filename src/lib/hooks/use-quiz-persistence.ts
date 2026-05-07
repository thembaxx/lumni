"use client";

import { useCallback, useEffect, useRef } from "react";
import type { QAQuestion } from "@/lib/types/questions";

const QUIZ_STORAGE_KEY = "lumni_quiz_progress";
const AUTO_SAVE_INTERVAL = 5000;

export interface QuizProgressData {
	subject: string;
	topic?: string;
	questions: QAQuestion[];
	currentIndex: number;
	answers: Record<string, string>;
	correctAnswers: number;
	skippedIndices: number[];
	startedAt: number;
	elapsedTime: number;
}

export interface UseQuizPersistenceOptions {
	subject: string;
	topic?: string;
	questions: QAQuestion[];
	currentIndex: number;
	answers: Record<string, string>;
	correctAnswers: number;
	skippedIndices: number[];
	onRestore: (progress: QuizProgressData) => void;
	enabled?: boolean;
}

export function useQuizPersistence({
	subject,
	topic,
	questions,
	currentIndex,
	answers,
	correctAnswers,
	skippedIndices,
	onRestore,
	enabled = true,
}: UseQuizPersistenceOptions) {
	const intervalRef = useRef<NodeJS.Timeout | null>(null);
	const lastSavedRef = useRef<string>("");

	const getStorageKey = useCallback(() => {
		return `${QUIZ_STORAGE_KEY}_${subject}`;
	}, [subject]);

	const saveProgress = useCallback(() => {
		if (!questions.length) return;

		const progress: QuizProgressData = {
			subject,
			topic,
			questions,
			currentIndex,
			answers,
			correctAnswers,
			skippedIndices,
			startedAt: Date.now(),
			elapsedTime: 0,
		};

		const serialized = JSON.stringify(progress);
		if (serialized === lastSavedRef.current) return;

		lastSavedRef.current = serialized;
		try {
			localStorage.setItem(getStorageKey(), serialized);
		} catch (e) {
			console.error("Failed to save quiz progress:", e);
		}
	}, [
		subject,
		topic,
		questions,
		currentIndex,
		answers,
		correctAnswers,
		skippedIndices,
		getStorageKey,
	]);

	const loadProgress = useCallback((): QuizProgressData | null => {
		try {
			const stored = localStorage.getItem(getStorageKey());
			if (!stored) return null;

			const progress: QuizProgressData = JSON.parse(stored);
			const hoursSinceStart =
				(Date.now() - progress.startedAt) / (1000 * 60 * 60);

			if (hoursSinceStart > 24) {
				localStorage.removeItem(getStorageKey());
				return null;
			}

			return progress;
		} catch {
			return null;
		}
	}, [getStorageKey]);

	const restoreProgress = useCallback(() => {
		const progress = loadProgress();
		if (progress && progress.questions.length > 0) {
			progress.elapsedTime = Math.floor(
				(Date.now() - progress.startedAt) / 1000,
			);
			onRestore(progress);
			return true;
		}
		return false;
	}, [loadProgress, onRestore]);

	const clearProgress = useCallback(() => {
		try {
			localStorage.removeItem(getStorageKey());
			lastSavedRef.current = "";
		} catch (e) {
			console.error("Failed to clear quiz progress:", e);
		}
	}, [getStorageKey]);

	useEffect(() => {
		if (!enabled || !questions.length) return;

		intervalRef.current = setInterval(saveProgress, AUTO_SAVE_INTERVAL);
		saveProgress();

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		};
	}, [enabled, questions.length, saveProgress]);

	const hasExistingProgress = useCallback(() => {
		const stored = localStorage.getItem(getStorageKey());
		return !!stored;
	}, [getStorageKey]);

	return {
		saveProgress,
		loadProgress,
		restoreProgress,
		clearProgress,
		hasExistingProgress,
	};
}
