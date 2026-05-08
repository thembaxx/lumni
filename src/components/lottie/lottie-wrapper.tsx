"use client";

import dynamic from "next/dynamic";
import { LOTTIE_ANIMATIONS, type LottieAnimationName } from "./lottie-assets";

const Lottie = dynamic(() => import("lottie-react"), {
	ssr: false,
	loading: () => null,
});

interface LottieWrapperProps {
	animation: LottieAnimationName;
	loop?: boolean;
	autoplay?: boolean;
	onComplete?: () => void;
	className?: string;
	style?: React.CSSProperties;
}

export function LottieWrapper({
	animation,
	loop = false,
	autoplay = true,
	onComplete,
	className,
	style,
}: LottieWrapperProps) {
	const animationData = LOTTIE_ANIMATIONS[animation];

	return (
		<Lottie
			animationData={animationData}
			loop={loop}
			autoplay={autoplay}
			onComplete={onComplete}
			className={className}
			style={style}
		/>
	);
}
