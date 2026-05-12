"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { normalTransition } from "@/lib/utils/animation";

interface AnimatedCardProps {
	children: ReactNode;
	delay?: number;
	className?: string;
}

export function AnimatedCard({
	children,
	delay = 0,
	className,
}: AnimatedCardProps) {
	const shouldReduceMotion = useReducedMotion();

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{
				...normalTransition,
				delay: shouldReduceMotion ? 0 : delay,
			}}
			className={className}
		>
			{children}
		</motion.div>
	);
}
