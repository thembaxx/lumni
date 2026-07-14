"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Orb = {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
};

interface AmbientBackgroundProps {
  orbCount?: number;
  className?: string;
  variant?: "dashboard" | "hero" | "quiz";
}

const COLOR_SETS = {
  dashboard: [
    "oklch(55% 0.26 146 / 0.08)",
    "oklch(72% 0.28 55 / 0.06)",
    "oklch(58% 0.28 265 / 0.05)",
  ],
  hero: [
    "oklch(55% 0.26 146 / 0.12)",
    "oklch(72% 0.28 55 / 0.08)",
    "oklch(58% 0.28 265 / 0.06)",
    "oklch(68% 0.26 145 / 0.07)",
  ],
  quiz: ["oklch(55% 0.26 146 / 0.06)", "oklch(72% 0.28 55 / 0.04)"],
};

export function AmbientBackground({
  orbCount = 4,
  className,
  variant = "dashboard",
}: AmbientBackgroundProps) {
  const [orbs] = useState<Orb[]>(() => {
    const colors = COLOR_SETS[variant] ?? COLOR_SETS.dashboard;
    return Array.from({ length: orbCount }, (_, i) => ({
      id: i,
      x: 10 + Math.random() * 80,
      y: 10 + Math.random() * 80,
      size: 120 + Math.random() * 200,
      color: colors[i % colors.length],
      delay: Math.random() * 4,
      duration: 6 + Math.random() * 6,
    }));
  });
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className={cn("pointer-events-none fixed inset-0 overflow-hidden", className)}
      aria-hidden
    >
      {orbs.map((orb) => (
        <div
          key={orb.id}
          className="ambient-orb"
          style={{
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            width: orb.size,
            height: orb.size,
            background: orb.color,
            animationDelay: `${orb.delay}s`,
            animationDuration: `${orb.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
