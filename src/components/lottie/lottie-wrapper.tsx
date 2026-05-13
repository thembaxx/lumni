"use client";

import type { DotLottie } from "@lottiefiles/dotlottie-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef } from "react";
import { type LottieAnimationName, getAnimationSrc } from "./lottie-assets";

const DotLottieReact = dynamic(
	() => import("@lottiefiles/dotlottie-react").then((m) => m.DotLottieReact),
	{
		ssr: false,
	},
);

interface LottieWrapperProps {
	animation: LottieAnimationName;
	loop?: boolean;
	autoplay?: boolean;
	onComplete?: () => void;
	className?: string;
	style?: React.CSSProperties;
	lottieRef?: React.RefObject<DotLottie | null>;
}

export function LottieWrapper({
	animation,
	loop = false,
	autoplay = true,
	onComplete,
	className,
	style,
	lottieRef,
}: LottieWrapperProps) {
	const dotLottieRef = useRef<DotLottie | null>(null);
	const onCompleteRef = useRef(onComplete);
	onCompleteRef.current = onComplete;

	const handleRef = useCallback(
		(dotLottie: DotLottie | null) => {
			dotLottieRef.current = dotLottie;
			if (lottieRef) {
				lottieRef.current = dotLottie;
			}
		},
		[lottieRef],
	);

	useEffect(() => {
		const instance = dotLottieRef.current;
		if (!instance || !onComplete) return;
		const handler = () => onCompleteRef.current?.();
		instance.addEventListener("complete", handler);
		return () => {
			instance.removeEventListener("complete", handler);
		};
	}, [onComplete]);

	return (
		<DotLottieReact
			src={getAnimationSrc(animation)}
			loop={loop}
			autoplay={autoplay}
			className={className}
			dotLottieRefCallback={handleRef}
			style={{ width: "100%", height: "100%", ...style }}
		/>
	);
}
