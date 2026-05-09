"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadFromStorage, saveToStorage } from "@/lib/utils/storage";
import { formatTime } from "@/lib/utils/time";

export interface QuizTimeoutConfig {
	enabled: boolean;
	duration: number;
	warningSeconds: number;
	autoSubmit: boolean;
	enablePause: boolean;
}

export interface UseQuizTimeoutReturn {
	timeRemaining: number;
	isPaused: boolean;
	isWarning: boolean;
	isExpired: boolean;
	formatTime: (seconds: number) => string;
	pause: () => void;
	resume: () => void;
	reset: (duration?: number) => void;
	stop: () => void;
	getElapsedTime: () => number;
}

const TIMEOUT_CONFIG_KEY = "quiz-timeout-config";

const DEFAULT_CONFIG: QuizTimeoutConfig = {
	enabled: true,
	duration: 30,
	warningSeconds: 10,
	autoSubmit: true,
	enablePause: true,
};

export function loadTimeoutConfig(): QuizTimeoutConfig {
	if (typeof window === "undefined") return DEFAULT_CONFIG;
	return loadFromStorage<QuizTimeoutConfig>(TIMEOUT_CONFIG_KEY, DEFAULT_CONFIG);
}

export function saveTimeoutConfig(config: QuizTimeoutConfig): void {
	if (typeof window === "undefined") return;
	saveToStorage(TIMEOUT_CONFIG_KEY, config);
}

export function useQuizTimeout(
	config: QuizTimeoutConfig = DEFAULT_CONFIG,
	onTimeout?: () => void,
	onWarning?: () => void,
): UseQuizTimeoutReturn {
	const [timeRemaining, setTimeRemaining] = useState(config.duration);
	const [isPaused, setIsPaused] = useState(false);
	const [isWarning, setIsWarning] = useState(false);
	const [isExpired, setIsExpired] = useState(false);
	const [startTime, setStartTime] = useState<number | null>(null);
	const [pausedTime, setPausedTime] = useState(0);

	const intervalRef = useRef<NodeJS.Timeout | null>(null);
	const warningFiredRef = useRef(false);

	const clearTimer = useCallback(() => {
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}
	}, []);

	const startTimer = useCallback(() => {
		clearTimer();

		if (!config.enabled || isPaused || timeRemaining <= 0) return;

		intervalRef.current = setInterval(() => {
			setTimeRemaining((prev) => {
				const newTime = prev - 1;

				if (newTime <= config.warningSeconds && !warningFiredRef.current) {
					setIsWarning(true);
					warningFiredRef.current = true;
					onWarning?.();
				}

				if (newTime <= 0) {
					clearTimer();
					setIsExpired(true);
					if (config.autoSubmit) {
						onTimeout?.();
					}
					return 0;
				}

				return newTime;
			});
		}, 1000);
	}, [
		config.enabled,
		config.autoSubmit,
		config.warningSeconds,
		isPaused,
		timeRemaining,
		clearTimer,
		onTimeout,
		onWarning,
	]);

	const pause = useCallback(() => {
		if (!config.enablePause || isPaused) return;
		clearTimer();
		setPausedTime((prev) => prev + (Date.now() - (startTime || Date.now())));
		setIsPaused(true);
	}, [config.enablePause, isPaused, clearTimer, startTime]);

	const resume = useCallback(() => {
		if (!isPaused) return;
		setIsPaused(false);
		setStartTime(Date.now());
		setIsWarning(false);
		warningFiredRef.current = false;
	}, [isPaused]);

	const reset = useCallback(
		(duration?: number) => {
			clearTimer();
			const newDuration = duration ?? config.duration;
			setTimeRemaining(newDuration);
			setStartTime(Date.now());
			setPausedTime(0);
			setIsPaused(false);
			setIsWarning(false);
			setIsExpired(false);
			warningFiredRef.current = false;

			if (config.enabled) {
				setTimeout(() => startTimer(), 0);
			}
		},
		[config.duration, config.enabled, clearTimer, startTimer],
	);

	const stop = useCallback(() => {
		clearTimer();
		setTimeRemaining(0);
		setIsPaused(false);
		setIsWarning(false);
		setIsExpired(false);
	}, [clearTimer]);

	const getElapsedTime = useCallback((): number => {
		if (!startTime) return 0;
		const now = isPaused ? startTime : Date.now();
		return Math.floor((now - startTime + pausedTime) / 1000);
	}, [startTime, isPaused, pausedTime]);

	useEffect(() => {
		if (config.enabled && !isPaused && !isExpired) {
			setStartTime(Date.now());
			startTimer();
		}

		return () => clearTimer();
	}, [config.enabled, startTimer, clearTimer, isPaused, isExpired]);

	return {
		timeRemaining,
		isPaused,
		isWarning,
		isExpired,
		formatTime,
		pause,
		resume,
		reset,
		stop,
		getElapsedTime,
	};
}
