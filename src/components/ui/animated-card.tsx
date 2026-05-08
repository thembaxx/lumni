"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

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
	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay, duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
			className={className}
		>
			{children}
		</motion.div>
	);
}
