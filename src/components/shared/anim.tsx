"use client";

import { m, type Transition, type Variants } from "framer-motion";

interface AnimProps {
	children: React.ReactNode;
	layoutId?: string;
	initial?: boolean;
	variants?: Variants;
	transition?: Transition;
}

export function Anim({
	children,
	layoutId,
	initial = true,
	variants,
	transition,
}: AnimProps) {
	return (
		<m.div
			layoutId={layoutId}
			initial={initial ? "hidden" : false}
			animate="visible"
			exit="hidden"
			variants={variants}
			transition={transition}
		>
			{children}
		</m.div>
	);
}
