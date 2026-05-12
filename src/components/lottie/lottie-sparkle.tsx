"use client";

import type { LottieAnimationName } from "./lottie-assets";
import { LottieWrapper } from "./lottie-wrapper";

interface LottieSparkleProps {
	animation: LottieAnimationName;
	trigger: number;
	className?: string;
}

export function LottieSparkle({
	animation,
	trigger,
	className,
}: LottieSparkleProps) {
	if (trigger === 0) return null;

	return (
		<LottieWrapper
			key={trigger}
			animation={animation}
			className={className}
			loop={false}
			autoplay
		/>
	);
}
