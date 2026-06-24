"use client";

import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { cn } from "@/lib/utils";
import { iOSEase } from "@/lib/utils/animation";
import { useOptimizedAnimation } from "@/lib/utils/animation-optimization";

type FadeInDirection = "up" | "down" | "left" | "right" | "scale";

interface FadeInProps {
  children: React.ReactNode;
  direction?: FadeInDirection;
  delay?: number;
  duration?: number;
  distance?: number;
  scaleDistance?: number;
  className?: string;
  as?: "div" | "span";
  performanceAware?: boolean;
  role?: string;
  "aria-label"?: string;
  "aria-live"?: "off" | "assertive" | "polite";
}

const directionVariants: Record<FadeInDirection, (d: number) => Record<string, number>> = {
  up: (d) => ({ y: d }),
  down: (d) => ({ y: -d }),
  left: (d) => ({ x: d }),
  right: (d) => ({ x: -d }),
  scale: (d) => ({ scale: d }),
};

export function FadeIn({
  children,
  direction = "up",
  delay = 0,
  duration = 0.35,
  distance = 8,
  scaleDistance = 0.96,
  className,
  as = "div",
  performanceAware = false,
  ...rest
}: FadeInProps & Record<string, unknown>) {
  const prefersReduced = useReducedMotion();
  const animOpts = performanceAware ? useOptimizedAnimation() : null;
  const shouldReduce = prefersReduced || (animOpts?.shouldReduceMotion ?? false);
  const scaleVal = direction === "scale" ? scaleDistance : distance;
  const initialOffset = directionVariants[direction](scaleVal);
  const initial = { opacity: 0, ...initialOffset };
  const Tag = as === "span" ? m.span : m.div;

  if (shouldReduce) {
    return (
      <Tag className={cn(className)} {...rest}>
        {children}
      </Tag>
    );
  }

  return (
    <Tag
      initial={initial}
      animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
      transition={{ duration, ease: iOSEase, delay }}
      className={cn(className)}
      {...rest}
    >
      {children}
    </Tag>
  );
}
