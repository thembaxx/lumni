/**
 * Spring presets aligned with Apple's damping + response model.
 *
 * Apple exposes two parameters for spring physics:
 *   - Damping ratio: 1.0 = critically damped (no overshoot), < 1.0 = underdamped (bounces)
 *   - Response (s):  how quickly the value reaches target. Lower = snappier.
 *
 * These are converted to Motion's stiffness/damping/mass/bounce API.
 *
 * Apple defaults:
 *   Move/reposition: damping 1.0, response 0.4  — critically damped, snappy settle
 *   Rotation:        damping 0.8, response 0.4  — subtle bounce for physical objects
 *   Drawer/sheet:    damping 0.8, response 0.3  — quicker response, slight bounce from momentum
 *
 * Rule of thumb:
 *   - Critically damped (damping 1.0) for all non-momentum UI
 *   - Underdamped (damping 0.8) only when the gesture itself carried momentum
 */
export const springPresets = {
  /** Critically damped, snappy — safe default for all UI (maps to Apple damping 1.0, response 0.4) */
  fast: { type: "spring" as const, stiffness: 400, damping: 28, mass: 0.7, bounce: 0 },

  /** Standard UI entrance — no overshoot (Apple damping 1.0, response 0.35) */
  standard: { type: "spring" as const, stiffness: 300, damping: 26, mass: 0.8, bounce: 0 },

  /** Slower, deliberate motion — progress bars, heavy elements (Apple damping 1.0, response 0.5) */
  slow: { type: "spring" as const, stiffness: 200, damping: 24, mass: 1, bounce: 0 },

  /** Card exit — quick fly-out, no bounce (Apple damping 1.0, response 0.25) */
  cardExit: { type: "spring" as const, stiffness: 400, damping: 30, mass: 0.6, bounce: 0 },

  /** Momentum-driven bounce — only use when a flick/throw preceded it (Apple damping ~0.75, response 0.4) */
  bouncy: { type: "spring" as const, stiffness: 200, damping: 14, mass: 1, bounce: 0.25 },

  /**
   * Apple Move/Reposition — critically damped, no bounce.
   * Use for draggable repositioning (e.g. PiP, drag-to-reorder).
   * Maps to Apple: damping 1.0, response 0.4
   */
  appleMove: { type: "spring" as const, stiffness: 250, damping: 24, mass: 1, bounce: 0 },

  /**
   * Apple Sheet/Drawer — slight bounce for momentum feel.
   * Use for sheets, drawers, and panels triggered by gesture.
   * Maps to Apple: damping 0.8, response 0.3
   */
  appleSheet: { type: "spring" as const, stiffness: 350, damping: 18, mass: 0.8, bounce: 0.1 },

  /**
   * Apple Rotation — subtle bounce for physical rotation.
   * Maps to Apple: damping 0.8, response 0.4
   */
  appleRotation: { type: "spring" as const, stiffness: 220, damping: 15, mass: 1, bounce: 0.12 },

  /**
   * Materialize — for glass/frosted surfaces entering the viewport.
   * Combines scale + blur + opacity with a snappy spring.
   * Maps to Apple: damping 1.0, response 0.3 (critically damped, quick)
   */
  materialize: { type: "spring" as const, stiffness: 400, damping: 30, mass: 0.7, bounce: 0 },

  /**
   * Momentum/throw — for flick gestures that should glide to a stop.
   * Very light damping, long tail. Used after velocity handoff.
   * Maps to Apple: damping 0.7, response 0.5
   */
  momentum: { type: "spring" as const, stiffness: 150, damping: 12, mass: 1.2, bounce: 0.05 },
} as const;

export type SpringPreset = keyof typeof springPresets;
export type SpringConfig = (typeof springPresets)[SpringPreset];

/**
 * Projection — estimate the distance a gesture will travel given its release velocity.
 *
 * Uses Apple's exponential-decay form from Designing Fluid Interfaces (WWDC 2018).
 * decelerationRate ≈ 0.998 for normal scroll feel, 0.99 for snappier.
 *
 * projectedEndpoint = currentPosition + project(releaseVelocity);
 * target = nearestSnapPoint(projectedEndpoint);
 * animateSpringTo(target, { velocity: releaseVelocity });
 */
export function projectMomentum(velocity: number, decelerationRate = 0.998): number {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

/**
 * Rubber-banding — progressive resistance at boundaries.
 *
 * The further past the bound the user drags, the less the element follows.
 * Ensures a soft boundary feel instead of a hard stop.
 *
 * Uses Apple's canonical form: (overshoot * dimension * constant) / (dimension + constant * |overshoot|)
 */
export function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

/**
 * Snap — choose the nearest snap point from a sorted array.
 */
export function nearestSnapPoint(value: number, points: number[]): number {
  return points.reduce((prev, curr) =>
    Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev,
  );
}

/**
 * Normalize gesture velocity relative to remaining distance.
 * Use when the spring API needs relative velocity instead of absolute px/s.
 *
 * relativeVelocity = gestureVelocity / (targetValue - currentValue)
 */
export function normalizeVelocity(
  gestureVelocity: number,
  currentValue: number,
  targetValue: number,
): number {
  const remaining = targetValue - currentValue;
  if (remaining === 0) return 0;
  return gestureVelocity / remaining;
}
