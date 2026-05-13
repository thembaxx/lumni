"use client";

import type { DotLottie } from "@lottiefiles/dotlottie-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { type LottieAnimationName, loadAnimationData } from "./lottie-assets";

const DotLottieReact = dynamic(
	() => import("@lottiefiles/dotlottie-react").then((m) => m.DotLottieReact),
	{
		ssr: false,
		loading: () => <div style={{ width: "inherit", height: "inherit" }} />,
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
	const [data, setData] = useState<Record<string, unknown> | null>(null);
	const dotLottieRef = useRef<DotLottie | null>(null);
	const onCompleteRef = useRef(onComplete);
	onCompleteRef.current = onComplete;

	useEffect(() => {
		let cancelled = false;
		loadAnimationData(animation).then((d) => {
			if (!cancelled) setData(d);
		});
		return () => {
			cancelled = true;
		};
	}, [animation]);

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

	if (!data) {
		return <div className={className} />;
	}

	return (
		<DotLottieReact
			data={data}
			loop={loop}
			autoplay={autoplay}
			className={className}
			dotLottieRefCallback={handleRef}
			style={{ width: "100%", height: "100%", ...style }}
		/>
	);
}
