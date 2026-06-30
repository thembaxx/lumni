"use client";

import { cn } from "@/lib/utils";

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
          <div className="absolute -top-40 -right-40 size-[500px] animate-float-drift rounded-full bg-primary/[0.03] blur-3xl" />
          <div
            className="absolute -bottom-40 -left-40 size-[500px] animate-float-drift rounded-full bg-chart-4/[0.03] blur-3xl"
            style={{ animationDelay: "-3s" }}
          />
        </>
      )}
      {variant === "subtle" && (
        <>
          <div className="absolute -top-40 left-1/3 size-[400px] animate-float-drift rounded-full bg-primary/[0.02] blur-3xl" />
          <div
            className="absolute -bottom-40 -right-40 size-[400px] animate-float-drift rounded-full bg-chart-3/[0.02] blur-3xl"
            style={{ animationDelay: "-4s" }}
          />
        </>
      )}
      {variant === "quiz" && (
        <>
          <div className="absolute -top-40 -right-40 size-[400px] animate-float-drift rounded-full bg-primary/[0.03] blur-3xl" />
          <div
            className="absolute -bottom-40 -left-40 size-[400px] animate-float-drift rounded-full bg-chart-4/[0.02] blur-3xl"
            style={{ animationDelay: "-2s" }}
          />
        </>
      )}
    </div>
  );
}
