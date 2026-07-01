"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ScrollReveal } from "./scroll-reveal";

interface BentoGridProps {
  children: ReactNode;
  className?: string;
  cols?: 1 | 2 | 3 | 4;
  gap?: "sm" | "md" | "lg";
}

const colMap = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

const gapMap = {
  sm: "gap-2",
  md: "gap-3",
  lg: "gap-4",
};

/**
 * Responsive bento grid layout.
 * 2026 trend: asymmetric, organic grid layouts that break the rigid card mold.
 */
export function BentoGrid({ children, className, cols = 2, gap = "md" }: BentoGridProps) {
  return (
    <div className={cn("grid", colMap[cols], gapMap[gap], className)}>
      {children}
    </div>
  );
}

interface BentoCardProps {
  children: ReactNode;
  className?: string;
  span?: 1 | 2 | 3;
  variant?: "default" | "glass" | "elevated" | "gradient";
  delay?: number;
}

const spanMap = {
  1: "",
  2: "sm:col-span-2",
  3: "sm:col-span-3",
};

const variantStyles = {
  default:
    "rounded-card-lg border border-border/80 bg-system-surface shadow-level-1",
  glass:
    "rounded-card-lg border border-border/40 bg-material-glass backdrop-blur-xl shadow-level-2",
  elevated:
    "rounded-card-lg border border-border/80 bg-system-surface shadow-level-2",
  gradient:
    "rounded-card-lg border border-border/40 bg-gradient-to-br from-system-surface via-system-surface to-primary/[0.02] shadow-level-1",
};

/**
 * Individual bento card with span support and visual variants.
 */
export function BentoCard({
  children,
  className,
  span = 1,
  variant = "default",
  delay = 0,
}: BentoCardProps) {
  return (
    <ScrollReveal delay={delay} distance={20} className={cn(spanMap[span], className)}>
      <div
        className={cn(
          "group relative flex flex-col p-4 transition-all duration-300 hover:shadow-level-2",
          variantStyles[variant],
        )}
      >
        {children}
      </div>
    </ScrollReveal>
  );
}