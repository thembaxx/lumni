"use client";

import { useEffect, useRef } from "react";
import { logError } from "@/lib/shared/logger";

/**
 * Animation budget configuration
 */
export interface AnimationBudget {
  /** Maximum time (in ms) allowed for animations per frame */
  maxFrameTime: number;
  /** Warning threshold (in ms) for animation performance */
  warningThreshold: number;
  /** Whether to disable animations when budget is exceeded */
  disableOnExceed: boolean;
}

/**
 * Default animation budget (aiming for 60fps = 16.67ms per frame)
 * We allocate 8ms for animations to leave room for other work
 */
const DEFAULT_ANIMATION_BUDGET: AnimationBudget = {
  maxFrameTime: 8,
  warningThreshold: 6,
  disableOnExceed: false,
};

/**
 * Hook to monitor animation frame rates and enforce budgets
 */
function useAnimationBudget(budget: AnimationBudget = DEFAULT_ANIMATION_BUDGET) {
  const frameCountRef = useRef(0);
  const lastFrameTimeRef = useRef<number | null>(null);
  const budgetExceededRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);

  // Check if we should reduce motion based on user preference
  const shouldReduceMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Performance observer for measuring frame times
  useEffect(() => {
    if (typeof window === "undefined" || shouldReduceMotion) return;

    lastFrameTimeRef.current = performance.now();

    const frameCallback = (time: number) => {
      frameCountRef.current++;
      const frameTime = time - (lastFrameTimeRef.current ?? time);

      // Check if we're exceeding our animation budget
      if (frameTime > budget.maxFrameTime) {
        budgetExceededRef.current = true;
        if (budget.disableOnExceed) {
          // In a real implementation, we would communicate this to animation components
          logError(
            "AnimationBudget.Exceeded",
            new Error(`Budget exceeded: ${frameTime.toFixed(2)}ms > ${budget.maxFrameTime}ms`),
          );
        }
      } else if (frameTime > budget.warningThreshold) {
        // Just warn if we're approaching the limit
        budgetExceededRef.current = true;
      } else {
        budgetExceededRef.current = false;
      }

      lastFrameTimeRef.current = time;
      animationFrameRef.current = requestAnimationFrame(frameCallback);
    };

    // Start the animation frame loop
    animationFrameRef.current = requestAnimationFrame(frameCallback);

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [budget, shouldReduceMotion]);

  // Get current budget status
  const isBudgetExceeded = budgetExceededRef.current;

  // Get average FPS over last second (approximation)
  useEffect(() => {
    if (typeof window === "undefined" || shouldReduceMotion) return;

    const updateFPS = () => {
      const now = performance.now();
      const elapsed = now - (lastFrameTimeRef.current ?? now);

      if (elapsed >= 1000) {
        // Reset counters
        frameCountRef.current = 0;
        lastFrameTimeRef.current = now;
      }

      requestAnimationFrame(updateFPS);
    };

    requestAnimationFrame(updateFPS);

    return () => {
      // No cleanup needed for this effect as it's self-cancelling
    };
  }, [shouldReduceMotion]);

  return {
    isBudgetExceeded,
    shouldReduceMotion: shouldReduceMotion || isBudgetExceeded,
    // In a real implementation, these would be used to adjust animation behavior
    getAnimationScale: () => (isBudgetExceeded ? 0.5 : 1),
    getAnimationDurationMultiplier: () => (isBudgetExceeded ? 2 : 1), // Slow down animations when exceeding budget
  };
}

/**
 * Utility function to create optimized animation presets
 */
const createOptimizedPresets = () => {
  return {
    // Reduced motion preset for when budget is exceeded or user prefers reduced motion
    reducedMotion: {
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 26,
        bounce: 0,
      },
    },

    // Normal preset for when we have budget headroom
    normal: {
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 26,
        bounce: 0,
      },
    },

    // Fast preset for urgent feedback
    fast: {
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 26,
        bounce: 0,
      },
    },

    // Slow preset for entrances and attention-grabbing animations
    slow: {
      transition: {
        type: "spring",
        stiffness: 120,
        damping: 26,
        bounce: 0,
      },
    },
  };
};

/**
 * Hook to get optimized animation properties based on budget
 */
export function useOptimizedAnimation() {
  const { isBudgetExceeded, shouldReduceMotion } = useAnimationBudget();
  const presets = createOptimizedPresets();

  // Return appropriate animation config based on budget and user preference
  const getAnimationConfig = (variant: keyof typeof presets = "normal") => {
    if (shouldReduceMotion) {
      return presets.reducedMotion;
    }

    return presets[variant] || presets.normal;
  };

  return {
    isBudgetExceeded,
    shouldReduceMotion,
    getAnimationConfig,
  };
}
