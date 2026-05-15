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
}

export const PerpetualFloat = React.memo(function PerpetualFloat({
	children,
	className,
	floatRange = 6,
	speed = 3,
}: PerpetualFloatProps) {
	const y = useMotionValue(0);
	const opacity = useTransform(y, [-floatRange, 0, floatRange], [0.7, 1, 0.7]);

	useEffect(() => {
		const controls = animate(y, [0, -floatRange, floatRange, 0], {
			duration: speed,
			repeat: Infinity,
			repeatType: "reverse",
			ease: "easeInOut",
		});

		return () => controls.stop();
	}, [y, floatRange, speed]);

	return (
		<motion.div
			className={cn("will-change-transform", className)}
			style={{ y, opacity }}
		>
			{children}
		</motion.div>
	);
});
