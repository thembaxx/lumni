/* ============ Motion Easing ============ */
/* Fast-arrival overshoot curve: accelerates quickly, undershoots slightly, settles.
   Used for all motion primitives in the app. See DESIGN.md §6. */
export const motionEase: [number, number, number, number] = [0.175, 0.885, 0.32, 1.1];

/* Legacy iOS curves — maintained for backward compat, prefer motionEase for new code */
export const iOSEase: [number, number, number, number] = [0.16, 1, 0.3, 1];
export const iOSDecelerate: [number, number, number, number] = [0, 0, 0.2, 1];

/* ============ Spring Transitions ============ */
export const springTransition = {
  type: "spring" as const,
  stiffness: 400,
  damping: 30,
};
