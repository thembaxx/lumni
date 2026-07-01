/**
 * Haptic feedback utility — HIG-aligned
 * Uses the Vibration API for tactile feedback.
 * All functions are no-ops if navigator.vibrate is unavailable.
 */
const vibrate =
  typeof navigator !== "undefined" && navigator.vibrate ? navigator.vibrate.bind(navigator) : null;

const safe = (pattern: number | number[]) => {
  if (vibrate) vibrate(pattern);
};

export const haptics = {
  light: () => safe(10),
  medium: () => safe(20),
  heavy: () => safe(30),
  success: () => safe([10, 50, 10]),
  error: () => safe([50, 100, 50]),
  warning: () => safe([20, 100, 20]),
} as const;
