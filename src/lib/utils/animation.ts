/* ============ iOS Motion Curves ============ */
/* Apple HIG: decelerate (arrival), accelerate (departure), spring (gestures) */
export const iOSEase: [number, number, number, number] = [0.16, 1, 0.3, 1];
export const iOSDecelerate: [number, number, number, number] = [0, 0, 0.2, 1];
/* ============ Spring Transitions ============ */
export const springTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 30,
};
