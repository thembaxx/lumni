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
      {variant === "auth" && (
        <>
          <FloatDrift className="absolute -top-60 -right-60 size-[600px] rounded-full bg-primary/[0.04] blur-3xl" />
          <FloatDrift
            className="absolute -bottom-60 -left-60 size-[600px] rounded-full bg-chart-4/[0.03] blur-3xl"
            delay={-5}
          />
          <FloatDrift
            className="absolute top-1/3 left-1/2 size-[300px] rounded-full bg-chart-3/[0.02] blur-3xl"
            delay={-2}
          />
        </>
      )}
      {variant === "dashboard" && (
        <>
          <FloatDrift className="absolute -top-40 -right-40 size-[400px] rounded-full bg-primary/[0.03] blur-3xl" />
          <FloatDrift
            className="absolute -bottom-40 left-1/4 size-[350px] rounded-full bg-chart-2/[0.02] blur-3xl"
            delay={-3}
          />
          <FloatDrift
            className="absolute top-1/2 -right-20 size-[250px] rounded-full bg-chart-4/[0.02] blur-3xl"
            delay={-5}
          />
        </>
      )}
      {variant === "study" && (
        <>
          <FloatDrift className="absolute -top-40 -right-40 size-[450px] rounded-full bg-primary/[0.03] blur-3xl" />
          <FloatDrift
            className="absolute -bottom-40 -left-40 size-[450px] rounded-full bg-chart-3/[0.02] blur-3xl"
            delay={-4}
          />
          <FloatDrift
            className="absolute top-1/4 right-1/4 size-[200px] rounded-full bg-chart-2/[0.02] blur-3xl"
            delay={-2}
          />
        </>
      )}
    </div>
  );
}