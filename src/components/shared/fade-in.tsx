"use client";

import * as m from "motion/react-m";
import { cn } from "@/lib/utils";
import { iOSEase } from "@/lib/utils/animation";

type FadeInDirection = "up" | "down" | "left" | "right" | "scale";

interface FadeInProps {
	children: React.ReactNode;
	direction?: FadeInDirection;
	delay?: number;
	duration?: number;
	distance?: number;
	className?: string;
	as?: "div" | "span";
}

const directionVariants: Record<
	FadeInDirection,
	(d: number) => Record<string, number>
> = {
	up: (d) => ({ y: d }),
	down: (d) => ({ y: -d }),
	left: (d) => ({ x: d }),
	right: (d) => ({ x: -d }),
	scale: () => ({ scale: 0.96 }),
};

export function FadeIn({
	children,
	direction = "up",
	delay = 0,
	duration = 0.35,
	distance = 8,
	className,
	as = "div",
}: FadeInProps) {
	const initialOffset = directionVariants[direction](distance);
	const initial = { opacity: 0, ...initialOffset };
	const Tag = m[as];

	return (
		<Tag
			initial={initial}
			animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
			transition={{ duration, ease: iOSEase, delay }}
			className={cn(className)}
		>
			{children}
		</Tag>
	);
}
