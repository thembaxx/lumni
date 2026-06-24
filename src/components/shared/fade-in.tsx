"use client";

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
  className?: string;
  as?: "div" | "span";
  performanceAware?: boolean;
}

const directionVariants: Record<FadeInDirection, (d: number) => Record<string, number>> = {
  up: (d) => ({ y: d }),
  down: (d) => ({ y: -d }),
  left: (d) => ({ x: d }),
  right: (d) => ({ x: -d }),
  scale: () => ({ scale: 0.96 }),
};

export function FadeIn({
  children,
  direction = "up",
  delay = 0,
  duration = 0.35,
  distance = 8,
  className,
  as = "div",
  performanceAware = false,
}: FadeInProps) {
  const animOpts = performanceAware ? useOptimizedAnimation() : null;
  const shouldReduce = animOpts?.shouldReduceMotion ?? false;
  const initialOffset = directionVariants[direction](distance);
  const initial = { opacity: 0, ...initialOffset };
  const Tag = as === "span" ? m.span : m.div;

  if (shouldReduce) {
    return <Tag className={cn(className)}>{children}</Tag>;
  }

  return (
    <Tag
      initial={initial}
      animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
      transition={{ duration, ease: iOSEase, delay }}
      className={cn(className)}
    >
      {children}
    </Tag>
  );
}
