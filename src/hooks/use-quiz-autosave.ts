"use client";

import { useCallback, useEffect, useRef } from "react";
import {
	deleteQuizSession,
	getQuizSession,
	pauseQuizSession,
	type QuizAnswer,
	resumeQuizSession,
	saveQuizSession,
} from "@/lib/db/offline";
import type { QAQuestion } from "@/types/questions";

export interface UseQuizAutoSaveOptions {
	sessionId: string;
	subject: string;
	topic?: string;
	enabled?: boolean;
}

export interface UseQuizAutoSaveReturn {
	saveProgress: (
		questions: QAQuestion[],
		currentIndex: number,
		answers: QuizAnswer[],
		duration: number,
	) => Promise<void>;
	loadSession: () => Promise<QuizSessionData | null>;
	resumeSession: () => Promise<QuizSessionData | null>;
	pauseSession: () => Promise<void>;
	removeSession: () => Promise<void>;
	hasActiveSession: boolean;
}

export interface QuizSessionData {
	sessionId: string;
	subject: string;
	topic?: string;
	questions: QAQuestion[];
	answers: QuizAnswer[];
	currentIndex: number;
	startedAt: number;
	lastSavedAt: number;
	isPaused: boolean;
	duration: number;
}

export function useQuizAutoSave(
	options: UseQuizAutoSaveOptions,
): UseQuizAutoSaveReturn {
	const { sessionId, subject, topic, enabled = true } = options;
	const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const lastSaveRef = useRef<string>("");

	const hasActiveSessionRef = useRef(false);

	const saveProgress = useCallback(
		async (
			questions: QAQuestion[],
			currentIndex: number,
			answers: QuizAnswer[],
			duration: number,
		) => {
			if (!enabled || questions.length === 0) return;

			const saveData = JSON.stringify({ currentIndex, answers, duration });
			if (saveData === lastSaveRef.current) return;

			lastSaveRef.current = saveData;

			await saveQuizSession({
				sessionId,
				subject,
				topic,
				questions: JSON.stringify(questions),
				answers,
				currentIndex,
				startedAt: Date.now(),
				isPaused: false,
				duration,
			});

			hasActiveSessionRef.current = true;
		},
		[enabled, sessionId, subject, topic],
	);

	const loadSession = useCallback(async (): Promise<QuizSessionData | null> => {
		const session = await getQuizSession(sessionId);
		if (!session) return null;

		if (session.isPaused) return null;

		return {
			sessionId: session.sessionId,
			subject: session.subject,
			topic: session.topic,
			questions: JSON.parse(session.questions) as QAQuestion[],
			answers: session.answers,
			currentIndex: session.currentIndex,
			startedAt: session.startedAt,
			lastSavedAt: session.lastSavedAt,
			isPaused: session.isPaused,
			duration: session.duration,
		};
	}, [sessionId]);

	const resumeSession =
		useCallback(async (): Promise<QuizSessionData | null> => {
			const session = await resumeQuizSession(sessionId);
			if (!session) return null;

			hasActiveSessionRef.current = true;

			return {
				sessionId: session.sessionId,
				subject: session.subject,
				topic: session.topic,
				questions: JSON.parse(session.questions) as QAQuestion[],
				answers: session.answers,
				currentIndex: session.currentIndex,
				startedAt: session.startedAt,
				lastSavedAt: session.lastSavedAt,
				isPaused: false,
				duration: session.duration,
			};
		}, [sessionId]);

	const pauseSession = useCallback(async () => {
		await pauseQuizSession(sessionId);
		hasActiveSessionRef.current = false;
	}, [sessionId]);

	const removeSession = useCallback(async () => {
		await deleteQuizSession(sessionId);
		lastSaveRef.current = "";
		hasActiveSessionRef.current = false;
	}, [sessionId]);

	useEffect(() => {
		return () => {
			if (saveTimeoutRef.current) {
				clearTimeout(saveTimeoutRef.current);
			}
		};
	}, []);

	return {
		saveProgress,
		loadSession,
		resumeSession,
		pauseSession,
		removeSession,
		hasActiveSession: hasActiveSessionRef.current,
	};
}

export function generateSessionId(): string {
	return `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
