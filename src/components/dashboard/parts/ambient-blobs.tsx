"use client";

import { useReducedMotion } from "motion/react";

export function AmbientBlobs() {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-(--z-background) overflow-hidden"
      aria-hidden="true"
    >
      <div
        className="animate-blob absolute -top-24 -right-24 size-96 rounded-full opacity-[0.04] blur-3xl"
        style={{ background: "var(--system-accent)" }}
      />
      <div
        className="animate-blob-delayed absolute -bottom-32 -left-32 size-80 rounded-full opacity-[0.03] blur-3xl"
        style={{ background: "var(--system-warning)" }}
      />
      <div
        className="animate-blob absolute top-1/3 left-1/2 size-64 rounded-full opacity-[0.02] blur-3xl"
        style={{ background: "var(--system-info)" }}
      />
    </div>
  );
}
