"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseIntervalOptions {
	enabled?: boolean;
}

export function useInterval(
	callback: () => void,
	delay: number | null,
	options: UseIntervalOptions = {},
) {
	const { enabled = true } = options;
	const savedCallback = useRef(callback);

	useEffect(() => {
		savedCallback.current = callback;
	}, [callback]);

	useEffect(() => {
		if (!enabled || delay === null) {
			return;
		}

		const id = setInterval(() => savedCallback.current(), delay);

		return () => clearInterval(id);
	}, [delay, enabled]);
}

export function useTimer(
	initialValue: number,
	callback?: (remaining: number) => void,
) {
	const [timeLeft, setTimeLeft] = useState(initialValue);
	const [isRunning, setIsRunning] = useState(false);

	const tick = useCallback(() => {
		setTimeLeft((prev) => {
			if (prev <= 0) {
				setIsRunning(false);
				callback?.(0);
				return 0;
			}
			const next = prev - 1;
			callback?.(next);
			return next;
		});
	}, [callback]);

	useInterval(tick, isRunning ? 1000 : null);

	const start = useCallback(() => setIsRunning(true), []);
	const stop = useCallback(() => setIsRunning(false), []);
	const reset = useCallback(() => {
		setIsRunning(false);
		setTimeLeft(initialValue);
	}, [initialValue]);

	return {
		timeLeft,
		isRunning,
		start,
		stop,
		reset,
		setTimeLeft,
	};
}
