"use client";

import {
	AlertCircleIcon,
	ArrowLeft01Icon,
	Award01Icon,
	CancelCircleIcon,
	CheckmarkCircle01Icon,
	CrownIcon,
	FireIcon,
	Confetti as PhosphorConfetti,
	RadialIcon,
	Search01Icon,
	SparklesIcon,
	Upload01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { m } from "framer-motion";
import type { ComponentProps } from "react";

export type AnimationPreset =
	| "spin"
	| "pulse"
	| "bounce"
	| "shake"
	| "scale"
	| "rotate"
	| "sway";

export const iconAnimations = {
	spin: {
		rotate: 360,
		transition: { duration: 1, repeat: Infinity, ease: "linear" },
	},
	pulse: {
		scale: [1, 1.1, 1],
		transition: { duration: 1.5, repeat: Infinity },
	},
	bounce: { y: [0, -10, 0], transition: { duration: 0.6, repeat: Infinity } },
	shake: { x: [-5, 5, -5, 5, 0], transition: { duration: 0.4 } },
	scale: { scale: [0, 1.2, 1], transition: { duration: 0.3 } },
} as const;

interface IconMappingEntry {
	icon: typeof CheckmarkCircle01Icon;
	size: number;
	animation?: AnimationPreset;
}

const animationPresets: Record<
	AnimationPreset,
	ComponentProps<typeof m.div>["animate"]
> = {
	spin: { rotate: 360 },
	pulse: { scale: [1, 1.1, 1] },
	bounce: { y: [0, -10, 0] },
	shake: { x: [-5, 5, -5, 5, 0] },
	scale: { scale: [0, 1.2, 1] },
	rotate: { rotate: [0, 10, -10, 0] },
	sway: { rotate: [0, 5, -5, 0] },
};

const animationTransitions: Record<
	AnimationPreset,
	ComponentProps<typeof m.div>["transition"]
> = {
	spin: { duration: 1, repeat: Infinity, ease: "linear" },
	pulse: { duration: 1.5, repeat: Infinity },
	bounce: { duration: 0.6, repeat: Infinity },
	shake: { duration: 0.4 },
	scale: { duration: 0.3 },
	rotate: { duration: 0.5, repeat: 3 },
	sway: { duration: 0.5, repeat: Infinity, repeatDelay: 2 },
};

const animationMapping: Record<string, IconMappingEntry> = {
	"achievement-unlock": { icon: Award01Icon, size: 12, animation: "scale" },
	confetti: { icon: PhosphorConfetti, size: 16 },
	"empty-search": { icon: Search01Icon, size: 12, animation: "pulse" },
	"empty-upload": { icon: Upload01Icon, size: 12, animation: "bounce" },
	"error-state": { icon: AlertCircleIcon, size: 16, animation: "shake" },
	"level-up": { icon: CrownIcon, size: 16, animation: "rotate" },
	"loading-dots": { icon: RadialIcon, size: 4, animation: "spin" },
	"loading-lumni": { icon: RadialIcon, size: 14, animation: "spin" },
	"page-404": { icon: ArrowLeft01Icon, size: 6 },
	"quiz-correct": { icon: CheckmarkCircle01Icon, size: 5, animation: "scale" },
	"quiz-incorrect": { icon: CancelCircleIcon, size: 5, animation: "shake" },
	"streak-fire": { icon: FireIcon, size: 6, animation: "sway" },
	"success-check": {
		icon: CheckmarkCircle01Icon,
		size: 10,
		animation: "scale",
	},
	"typing-indicator": { icon: RadialIcon, size: 7, animation: "spin" },
	"xp-burst": { icon: SparklesIcon, size: 8, animation: "spin" },
};

export type LottieAnimationName = keyof typeof animationMapping;

export function getIconMapping(name: string): IconMappingEntry | undefined {
	return animationMapping[name];
}

export function AnimatedIcon({
	name,
	className,
	loop = false,
	...props
}: {
	name: LottieAnimationName;
	className?: string;
	loop?: boolean;
} & Omit<ComponentProps<typeof m.div>, "animate" | "transition">) {
	const mapping = animationMapping[name];
	if (!mapping) return null;

	const { icon: Icon, size, animation } = mapping;
	const hasAnimation = !!animation;
	const shouldLoop = loop && hasAnimation;

	const animateProps = animation ? animationPresets[animation] : undefined;
	const transitionProps = animation
		? { ...animationTransitions[animation], repeat: shouldLoop ? Infinity : 0 }
		: undefined;

	return (
		<m.div
			className={className}
			animate={animateProps}
			transition={transitionProps}
			{...props}
		>
			<HugeiconsIcon icon={Icon} size={size} />
		</m.div>
	);
}
