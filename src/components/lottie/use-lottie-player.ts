"use client";

import type { LottieRefCurrentProps } from "lottie-react";
import { useCallback, useRef, useState } from "react";

export function useLottiePlayer() {
	const lottieRef = useRef<LottieRefCurrentProps>(null);
	const [isPlaying, setIsPlaying] = useState(false);

	const play = useCallback(() => {
		lottieRef.current?.play();
		setIsPlaying(true);
	}, []);

	const pause = useCallback(() => {
		lottieRef.current?.pause();
		setIsPlaying(false);
	}, []);

	const stop = useCallback(() => {
		lottieRef.current?.stop();
		setIsPlaying(false);
	}, []);

	const reset = useCallback(() => {
		lottieRef.current?.stop();
		setIsPlaying(false);
	}, []);

	return {
		lottieRef,
		play,
		pause,
		stop,
		reset,
		isPlaying,
	};
}
