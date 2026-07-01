"use client";

import { cn } from "@/lib/utils";

interface NoiseOverlayProps {
  className?: string;
  opacity?: number;
}

/**
 * Subtle grain texture overlay for depth and tactile feel.
 * Uses SVG noise filter with CSS animation for organic movement.
 * 2026 trend: adding analog texture to digital interfaces.
 */
export function NoiseOverlay({ className, opacity = 0.03 }: NoiseOverlayProps) {
  return (
    <div
      className={cn("pointer-events-none fixed inset-0 z-(--z-overlay)", className)}
      aria-hidden="true"
      style={{ opacity }}
    >
      <div
        className="absolute inset-[-50%] h-[200%] w-[200%]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
          backgroundRepeat: "repeat",
          animation: "grain 0.3s steps(6) infinite",
        }}
      />
    </div>
  );
}
