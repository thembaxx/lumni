"use client";

import { useEffect, useRef, useState } from "react";

export function useAnimatedNumber(target: number, duration = 400, shouldAnimate = true) {
  const [displayValue, setDisplayValue] = useState(shouldAnimate ? 0 : target);
  const rafRef = useRef<number>(0);
  const startRef = useRef(0);
  const lastTargetRef = useRef(shouldAnimate ? 0 : target);

  useEffect(() => {
    if (!shouldAnimate) {
      setDisplayValue(target);
      return;
    }

    const from = lastTargetRef.current;
    lastTargetRef.current = target;

    if (from === target) {
      setDisplayValue(target);
      return;
    }

    startRef.current = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(from + (target - from) * eased);

      setDisplayValue(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration, shouldAnimate]);

  return shouldAnimate ? displayValue : target;
}
