import type { Transition, Variants } from "framer-motion";

/* ============ iOS Motion Curves ============ */
/* Apple HIG: decelerate (arrival), accelerate (departure), spring (gestures) */
export const iOSEase: [number, number, number, number] = [0.16, 1, 0.3, 1];
export const iOSDecelerate: [number, number, number, number] = [0, 0, 0.2, 1];
export const iOSAccelerate: [number, number, number, number] = [0.4, 0, 1, 1];
export const iOSSpring: [number, number, number, number] = [
	0.34, 1.56, 0.64, 1,
];
export const easeOutQuint: [number, number, number, number] = [
	0.22, 1, 0.36, 1,
];

/* ============ Duration Transitions ============ */
export const fastTransition: Transition = {
	duration: 0.2,
	ease: iOSEase,
};

export const normalTransition: Transition = {
	duration: 0.35,
	ease: iOSDecelerate,
};

export const slowTransition: Transition = {
	duration: 0.5,
	ease: iOSDecelerate,
};

/* ============ Page Transitions ============ */
/** Forward navigation: slide in from right, decelerate */
export const pageEnterForward: Transition = {
	duration: 0.35,
	ease: iOSDecelerate,
};

/** Back navigation: slide out to right, accelerate */
export const pageExitBack: Transition = {
	duration: 0.25,
	ease: iOSAccelerate,
};

/** Spring-backed interactive page transition */
export const pageSpring: Transition = {
	type: "spring",
	stiffness: 350,
	damping: 35,
	mass: 0.8,
};

/* ============ Spring Transitions ============ */
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

/** Soft spring for interactive gestures (swipe back) */
export const springGesture: Transition = {
	type: "spring",
	stiffness: 600,
	damping: 40,
	mass: 0.5,
};

/* ============ Stagger ============ */
export function stagger(delayMs: number = 0.05): Transition {
	return { duration: 0.3, ease: iOSDecelerate, delay: delayMs };
}

/* ============ Variant Presets ============ */
export const fadeInUp: Variants = {
	hidden: { opacity: 0, y: 8 },
	visible: (delay: number = 0) => ({
		opacity: 1,
		y: 0,
		transition: { duration: 0.35, ease: iOSDecelerate, delay },
	}),
};

export const fadeInScale: Variants = {
	hidden: { opacity: 0, scale: 0.96 },
	visible: (delay: number = 0) => ({
		opacity: 1,
		scale: 1,
		transition: { duration: 0.35, ease: iOSDecelerate, delay },
	}),
};

export const fadeInLeft: Variants = {
	hidden: { opacity: 0, x: -8 },
	visible: (delay: number = 0) => ({
		opacity: 1,
		x: 0,
		transition: { duration: 0.35, ease: iOSDecelerate, delay },
	}),
};

export const tabContent: Variants = {
	hidden: { opacity: 0, y: 4 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.2, ease: iOSDecelerate },
	},
	exit: {
		opacity: 0,
		y: -4,
		transition: { duration: 0.15, ease: iOSAccelerate },
	},
};

/* ============ Page Transition Variants ============ */
export const pageSlideVariants: Variants = {
	enter: (dir: "forward" | "back") => ({
		x: dir === "forward" ? 60 : -60,
		opacity: 0,
	}),
	center: {
		x: 0,
		opacity: 1,
		transition: { duration: 0.35, ease: iOSDecelerate },
	},
	exit: (dir: "forward" | "back") => ({
		x: dir === "forward" ? -40 : 40,
		opacity: 0,
		transition: { duration: 0.2, ease: iOSAccelerate },
	}),
};

/** iOS-style sheet/modal enter animation */
export const sheetVariants: Variants = {
	hidden: {
		y: "100%",
		transition: { duration: 0.3, ease: iOSAccelerate },
	},
	visible: {
		y: 0,
		transition: { duration: 0.4, ease: iOSDecelerate },
	},
	exit: {
		y: "100%",
		transition: { duration: 0.25, ease: iOSAccelerate },
	},
};

/** iOS-style popover/fade entrance */
export const popoverVariants: Variants = {
	hidden: {
		opacity: 0,
		scale: 0.95,
		transition: { duration: 0.15, ease: iOSAccelerate },
	},
	visible: {
		opacity: 1,
		scale: 1,
		transition: { duration: 0.25, ease: iOSDecelerate },
	},
	exit: {
		opacity: 0,
		scale: 0.95,
		transition: { duration: 0.15, ease: iOSAccelerate },
	},
};
