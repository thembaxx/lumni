"use client";

import { cn } from "@/lib/utils";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";

export function FloatDrift({ className, delay = 0 }: { className: string; delay?: number }) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className} />;
  }

  return (
    <m.div
      initial={{ x: 0, y: 0 }}
      animate={{ x: [0, 15, -10, 5, 0], y: [0, -12, 8, -5, 0] }}
      transition={{
        duration: 12,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
      className={className}
    />
  );
}

interface AmbientGradientProps {
  className?: string;
  variant?: "default" | "subtle" | "quiz";
}

export function AmbientGradient({ className, variant = "default" }: AmbientGradientProps) {
  return (
    <div
      className={cn("pointer-events-none fixed inset-0 overflow-hidden", className)}
      aria-hidden="true"
    >
      {variant === "default" && (
        <>
          <FloatDrift className="absolute -top-40 -right-40 size-[500px] rounded-full bg-primary/[0.03] blur-3xl" />
          <FloatDrift
            className="absolute -bottom-40 -left-40 size-[500px] rounded-full bg-chart-4/[0.03] blur-3xl"
            delay={-3}
          />
        </>
      )}
      {variant === "subtle" && (
        <>
          <FloatDrift className="absolute -top-40 left-1/3 size-[400px] rounded-full bg-primary/[0.02] blur-3xl" />
          <FloatDrift
            className="absolute -bottom-40 -right-40 size-[400px] rounded-full bg-chart-3/[0.02] blur-3xl"
            delay={-4}
          />
        </>
      )}
      {variant === "quiz" && (
        <>
          <FloatDrift className="absolute -top-40 -right-40 size-[400px] rounded-full bg-primary/[0.03] blur-3xl" />
          <FloatDrift
            className="absolute -bottom-40 -left-40 size-[400px] rounded-full bg-chart-4/[0.02] blur-3xl"
            delay={-2}
          />
        </>
      )}
    </div>
  );
}
