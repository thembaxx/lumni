"use client";

import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import * as React from "react";
import { useEffect } from "react";
import { cn } from "@/lib/shared";
import { useOptimizedAnimation } from "@/lib/utils/animation-optimization";

interface PerpetualFloatProps {
	children: React.ReactNode;
	className?: string;
	floatRange?: number;
	speed?: number;
	duration?: number;
	offsetY?: number;
}

export const PerpetualFloat = React.memo(function PerpetualFloat({
	children,
	className,
	floatRange = 6,
	speed,
	duration,
	offsetY,
}: PerpetualFloatProps) {
	const { shouldReduceMotion } = useOptimizedAnimation();

	// Don't animate if user prefers reduced motion or if we're exceeding budget
	const isAnimated = !shouldReduceMotion;

	const resolvedSpeed = speed ?? duration ?? 3;
	const resolvedRange = offsetY !== undefined ? Math.abs(offsetY) : floatRange;
	const y = useMotionValue(0);
	const opacity = useTransform(
		y,
		[-resolvedRange, 0, resolvedRange],
		[0.7, 1, 0.7],
	);

	useEffect(() => {
		// Skip animation entirely if reduced motion is preferred
		if (!isAnimated) {
			// Set to a static position
			y.set(0);
			return;
		}

		const controls = animate(y, [0, -resolvedRange, 0], {
			duration: resolvedSpeed,
			repeat: Infinity,
			repeatType: "reverse",
			ease: "easeInOut",
		});

		return () => controls.stop();
	}, [y, resolvedRange, resolvedSpeed, isAnimated]);

	return (
		<motion.div
			className={cn("will-change-transform", className)}
			style={{ y, opacity }}
		>
			{children}
		</motion.div>
	);
});
