export const springPresets = {
  fast: { type: "spring" as const, stiffness: 400, damping: 28, mass: 0.7, bounce: 0 },
  standard: { type: "spring" as const, stiffness: 300, damping: 26, mass: 0.8, bounce: 0 },
  slow: { type: "spring" as const, stiffness: 200, damping: 24, mass: 1, bounce: 0 },
  cardExit: { type: "spring" as const, stiffness: 400, damping: 30, mass: 0.6, bounce: 0 },
};

export function projectMomentum(velocity: number, decelerationRate = 0.998): number {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

export function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

export function nearestSnapPoint(value: number, points: number[]): number {
  return points.reduce((prev, curr) =>
    Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev,
  );
}
