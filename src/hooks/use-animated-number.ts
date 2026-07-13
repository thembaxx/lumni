"use client";

import { useEffect, useState } from "react";
import { useMotionValueEvent, useSpring } from "motion/react";
import { springPresets } from "@/lib/utils/spring-presets";

export function useAnimatedNumber(target: number, duration = 400, shouldAnimate = true) {
  const [displayValue, setDisplayValue] = useState(shouldAnimate ? 0 : target);
  const springValue = useSpring(0, {
    ...springPresets.standard,
    stiffness: springPresets.standard.stiffness * (400 / duration),
  });

  useEffect(() => {
    if (!shouldAnimate) {
      setDisplayValue(target);
      return;
    }
    springValue.set(target);
  }, [target, duration, shouldAnimate, springValue]);

  useMotionValueEvent(springValue, "change", (latest) => {
    setDisplayValue(Math.round(latest));
  });

  return shouldAnimate ? displayValue : target;
}
