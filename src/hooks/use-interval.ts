"use client";

import { useEffect, useRef } from "react";

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
