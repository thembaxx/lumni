"use client";

import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { cn } from "@/lib/utils";

interface YearRingProgressProps {
  progress: number;
  className?: string;
}

export function YearRingProgress({ progress, className }: YearRingProgressProps) {
  const prefersReducedMotion = useReducedMotion();
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(progress, 1));

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div className="relative flex size-20 items-center justify-center">
        <svg
          className="absolute inset-0 -rotate-90"
          width="80"
          height="80"
          viewBox="0 0 80 80"
          aria-hidden="true"
        >
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke="var(--system-separator)"
            strokeWidth="3"
          />
          <m.circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke="var(--system-accent)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={false}
            animate={
              prefersReducedMotion ? { strokeDashoffset: offset } : { strokeDashoffset: offset }
            }
            transition={
              prefersReducedMotion
                ? undefined
                : { type: "spring", stiffness: 120, damping: 12, mass: 0.8 }
            }
          />
        </svg>
        <m.span
          className="font-bold text-(--fs-body) text-foreground tabular-nums"
          initial={false}
          animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: [1, 1.08, 1] }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          {Math.round(progress * 100)}%
        </m.span>
      </div>
      <span className="font-medium text-(--fs-caption-2) text-muted-foreground whitespace-nowrap">
        Year done
      </span>
    </div>
  );
}
