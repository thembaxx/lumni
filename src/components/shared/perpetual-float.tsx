"use client";

import { animate, useMotionValue, useTransform } from "motion/react";
import * as m from "motion/react-m";
import { memo, type ReactNode, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useOptimizedAnimation } from "@/lib/utils/animation-optimization";

interface PerpetualFloatProps {
  children: ReactNode;
  className?: string;
  floatRange?: number;
  speed?: number;
  duration?: number;
  offsetY?: number;
  /** Number of float cycles before stopping. Undefined = infinite. */
  cycles?: number;
}

export const PerpetualFloat = memo(function PerpetualFloat({
  children,
  className,
  floatRange = 6,
  speed,
  duration,
  offsetY,
  cycles,
}: PerpetualFloatProps) {
  const { shouldReduceMotion } = useOptimizedAnimation();

  const isAnimated = !shouldReduceMotion;

  const resolvedSpeed = speed ?? duration ?? 3;
  const resolvedRange = offsetY !== undefined ? Math.abs(offsetY) : floatRange;
  const y = useMotionValue(0);
  const opacity = useTransform(y, [-resolvedRange, 0, resolvedRange], [0.7, 1, 0.7]);

  useEffect(() => {
    if (!isAnimated) {
      y.set(0);
      return;
    }

    const controls = animate(y, [0, -resolvedRange, 0], {
      duration: resolvedSpeed,
      repeat: cycles != null ? cycles - 1 : Number.POSITIVE_INFINITY,
      repeatType: "reverse",
      ease: "easeInOut",
    });

    return () => controls.stop();
  }, [y, resolvedRange, resolvedSpeed, isAnimated, cycles]);

  return (
    <m.div className={cn("will-change-transform", className)} style={{ y, opacity }}>
      {children}
    </m.div>
  );
});
