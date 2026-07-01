"use client";

import { cn } from "@/lib/utils";

export function FloatDrift({ className, delay = 0 }: { className: string; delay?: number }) {
  return (
    <div
      className={cn("animate-float-drift", className)}
      style={delay ? { animationDelay: `${delay}s` } : undefined}
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
