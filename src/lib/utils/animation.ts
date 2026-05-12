import type { Transition, Variants } from "framer-motion";

export const iOSEase: [number, number, number, number] = [0.16, 1, 0.3, 1];
export const easeOutQuint: [number, number, number, number] = [
	0.22, 1, 0.36, 1,
];

export const fastTransition: Transition = {
	duration: 0.2,
	ease: iOSEase,
};

export const normalTransition: Transition = {
	duration: 0.35,
	ease: iOSEase,
};

export const slowTransition: Transition = {
	duration: 0.5,
	ease: iOSEase,
};

export const pageTransition: Transition = {
	duration: 0.35,
	ease: iOSEase,
};

export const springTransition: Transition = {
	type: "spring",
	stiffness: 400,
	damping: 30,
};

export const springStiffTransition: Transition = {
	type: "spring",
	stiffness: 500,
	damping: 35,
};

export function stagger(delayMs: number = 0.05): Transition {
	return { duration: 0.3, ease: iOSEase, delay: delayMs };
}

export const fadeInUp: Variants = {
	hidden: { opacity: 0, y: 8 },
	visible: (delay: number = 0) => ({
		opacity: 1,
		y: 0,
		transition: { duration: 0.35, ease: iOSEase, delay },
	}),
};

export const fadeInScale: Variants = {
	hidden: { opacity: 0, scale: 0.96 },
	visible: (delay: number = 0) => ({
		opacity: 1,
		scale: 1,
		transition: { duration: 0.35, ease: iOSEase, delay },
	}),
};

export const fadeInLeft: Variants = {
	hidden: { opacity: 0, x: -8 },
	visible: (delay: number = 0) => ({
		opacity: 1,
		x: 0,
		transition: { duration: 0.35, ease: iOSEase, delay },
	}),
};

export const tabContent: Variants = {
	hidden: { opacity: 0, y: 4 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.2, ease: iOSEase },
	},
	exit: {
		opacity: 0,
		y: -4,
		transition: { duration: 0.15, ease: iOSEase },
	},
};
