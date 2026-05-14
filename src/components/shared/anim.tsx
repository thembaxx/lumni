"use client";

import { domAnimation, LazyMotion, motion, type Transition, type Variants } from "framer-motion";

interface AnimProps {
	children: React.ReactNode;
	layoutId?: string;
	initial?: boolean;
	variants?: Variants;
	transition?: Transition;
}

export function Anim({ children, layoutId, initial = true, variants, transition }: AnimProps) {
	return (
		<LazyMotion features={domAnimation}>
			<motion.div
				layoutId={layoutId}
				initial={initial ? "hidden" : false}
				animate="visible"
				exit="hidden"
				variants={variants}
				transition={transition}
			>
				{children}
			</motion.div>
		</LazyMotion>
	);
}
