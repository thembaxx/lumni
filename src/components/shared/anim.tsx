"use client";

import { useReducedMotion } from "motion/react";
import type { Transition, Variants } from "motion/react";
import * as m from "motion/react-m";
import { useOptimizedAnimation } from "@/lib/utils/animation-optimization";

interface AnimProps {
  children: React.ReactNode;
  layoutId?: string;
  initial?: boolean;
  variants?: Variants;
  transition?: Transition;
  performanceAware?: boolean;
}

export function Anim({ children, layoutId, initial = true, variants, transition, performanceAware = false }: AnimProps) {
  const reduced = useReducedMotion();
  const animOpts = performanceAware ? useOptimizedAnimation() : null;
  const shouldReduce = reduced || (animOpts?.shouldReduceMotion ?? false);

  if (shouldReduce) {
    return children;
  }

  return (
    <m.div
      layoutId={layoutId}
      initial={initial ? "hidden" : false}
      animate="visible"
      exit="hidden"
      variants={variants}
      transition={transition}
    >
      {children}
    </m.div>
  );
}
