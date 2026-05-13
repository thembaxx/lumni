"use client";

import type { DotLottie } from "@lottiefiles/dotlottie-react";
import { useCallback, useRef, useState } from "react";

export function useLottiePlayer() {
	const dotLottieRef = useRef<DotLottie | null>(null);
	const [isPlaying, setIsPlaying] = useState(false);

	const play = useCallback(() => {
		dotLottieRef.current?.play();
		setIsPlaying(true);
	}, []);

	const pause = useCallback(() => {
		dotLottieRef.current?.pause();
		setIsPlaying(false);
	}, []);

	const stop = useCallback(() => {
		dotLottieRef.current?.stop();
		setIsPlaying(false);
	}, []);

	const reset = useCallback(() => {
		dotLottieRef.current?.stop();
		setIsPlaying(false);
	}, []);

	return {
		lottieRef: dotLottieRef,
		play,
		pause,
		stop,
		reset,
		isPlaying,
	};
}
