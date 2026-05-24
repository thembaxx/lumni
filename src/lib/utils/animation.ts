import type { Transition } from "framer-motion";

/* ============ iOS Motion Curves ============ */
/* Apple HIG: decelerate (arrival), accelerate (departure), spring (gestures) */
export const iOSEase: [number, number, number, number] = [0.16, 1, 0.3, 1];
export const iOSDecelerate: [number, number, number, number] = [0, 0, 0.2, 1];
export const iOSAccelerate: [number, number, number, number] = [0.4, 0, 1, 1];
export const normalTransition: Transition = {
	duration: 0.35,
	ease: iOSDecelerate,
};

/* ============ Spring Transitions ============ */
export const springTransition: Transition = {
	type: "spring",
	stiffness: 400,
	damping: 30,
};
