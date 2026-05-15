"use client";

import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import * as React from "react";
import { useEffect } from "react";
import { cn } from "@/lib/shared";

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
	const resolvedSpeed = speed ?? duration ?? 3;
	const resolvedRange = offsetY !== undefined ? Math.abs(offsetY) : floatRange;
	const y = useMotionValue(0);
	const opacity = useTransform(
		y,
		[-resolvedRange, 0, resolvedRange],
		[0.7, 1, 0.7],
	);

	useEffect(() => {
		const controls = animate(y, [0, -resolvedRange, resolvedRange, 0], {
			duration: resolvedSpeed,
			repeat: Infinity,
			repeatType: "reverse",
			ease: "easeInOut",
		});

		return () => controls.stop();
	}, [y, resolvedRange, resolvedSpeed]);

	return (
		<motion.div
			className={cn("will-change-transform", className)}
			style={{ y, opacity }}
		>
			{children}
		</motion.div>
	);
});
