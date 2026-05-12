"use client";

import type { LottieRef } from "lottie-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { type LottieAnimationName, loadAnimationData } from "./lottie-assets";

const Lottie = dynamic(() => import("lottie-react"), {
	ssr: false,
	loading: () => <div style={{ width: "inherit", height: "inherit" }} />,
});

interface LottieWrapperProps {
	animation: LottieAnimationName;
	loop?: boolean;
	autoplay?: boolean;
	onComplete?: () => void;
	className?: string;
	style?: React.CSSProperties;
	lottieRef?: LottieRef;
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
	const [data, setData] = useState<object | null>(null);

	useEffect(() => {
		let cancelled = false;
		loadAnimationData(animation).then((d) => {
			if (!cancelled) setData(d);
		});
		return () => {
			cancelled = true;
		};
	}, [animation]);

	if (!data) {
		return <div className={className} />;
	}

	return (
		<Lottie
			animationData={data}
			loop={loop}
			autoplay={autoplay}
			onComplete={onComplete}
			className={className}
			lottieRef={lottieRef}
			style={{ width: "100%", height: "100%", ...style }}
		/>
	);
}
