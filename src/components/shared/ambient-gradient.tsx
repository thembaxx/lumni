"use client";

import { cn } from "@/lib/utils";

interface AmbientGradientProps {
  className?: string;
  variant?: "default" | "subtle" | "quiz" | "auth" | "dashboard" | "study";
}

function FloatDrift({ className, delay = 0 }: { className: string; delay?: number }) {
  return (
    <div
      className={cn("animate-float-drift", className)}
      style={delay ? { animationDelay: `${delay}s` } : undefined}
    />
  );
}

/**
 * Enhanced ambient gradient with 6 variants for different page types.
 * 2026 trend: organic, morphing background blobs that add depth without distraction.
 */
export function AmbientGradient({ className, variant = "default" }: AmbientGradientProps) {
  return (
    <div
      className={cn("pointer-events-none fixed inset-0 overflow-hidden", className)}
      aria-hidden="true"
    >
      {variant === "default" && (
        <>
          <FloatDrift className="absolute -top-40 -right-40 size-125 rounded-full bg-primary/3 blur-3xl" />
          <FloatDrift
            className="absolute -bottom-40 -left-40 size-125 rounded-full bg-chart-4/3 blur-3xl"
            delay={-3}
          />
        </>
      )}
      {variant === "subtle" && (
        <>
          <FloatDrift className="absolute -top-40 left-1/3 size-100 rounded-full bg-primary/2 blur-3xl" />
          <FloatDrift
            className="absolute -bottom-40 -right-40 size-100 rounded-full bg-chart-3/2 blur-3xl"
            delay={-4}
          />
        </>
      )}
      {variant === "quiz" && (
        <>
          <FloatDrift className="absolute -top-40 -right-40 size-100 rounded-full bg-primary/3 blur-3xl" />
          <FloatDrift
            className="absolute -bottom-40 -left-40 size-100 rounded-full bg-chart-4/2 blur-3xl"
            delay={-2}
          />
        </>
      )}
      {variant === "auth" && (
        <>
          <FloatDrift className="absolute -top-60 -right-60 size-150 rounded-full bg-primary/4 blur-3xl" />
          <FloatDrift
            className="absolute -bottom-60 -left-60 size-150 rounded-full bg-chart-4/3 blur-3xl"
            delay={-5}
          />
          <FloatDrift
            className="absolute top-1/3 left-1/2 size-75 rounded-full bg-chart-3/2 blur-3xl"
            delay={-2}
          />
        </>
      )}
      {variant === "dashboard" && (
        <>
          <FloatDrift className="absolute -top-40 -right-40 size-100 rounded-full bg-primary/3 blur-3xl" />
          <FloatDrift
            className="absolute -bottom-40 left-1/4 size-87.5 rounded-full bg-chart-2/2 blur-3xl"
            delay={-3}
          />
          <FloatDrift
            className="absolute top-1/2 -right-20 size-62.5 rounded-full bg-chart-4/2 blur-3xl"
            delay={-5}
          />
        </>
      )}
      {variant === "study" && (
        <>
          <FloatDrift className="absolute -top-40 -right-40 size-112.5 rounded-full bg-primary/3 blur-3xl" />
          <FloatDrift
            className="absolute -bottom-40 -left-40 size-112.5 rounded-full bg-chart-3/2 blur-3xl"
            delay={-4}
          />
          <FloatDrift
            className="absolute top-1/4 right-1/4 size-50 rounded-full bg-chart-2/2 blur-3xl"
            delay={-2}
          />
        </>
      )}
    </div>
  );
}
