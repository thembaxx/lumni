"use client";

import { useReducedMotion } from "motion/react";
import type { Transition, Variants } from "motion/react";
import * as m from "motion/react-m";

interface AnimProps {
  children: React.ReactNode;
  layoutId?: string;
  initial?: boolean;
  variants?: Variants;
  transition?: Transition;
}

export function Anim({ children, layoutId, initial = true, variants, transition }: AnimProps) {
  const reduced = useReducedMotion();

  if (reduced) {
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
