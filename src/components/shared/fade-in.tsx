"use client";

import { m } from "motion/react";
import { cn } from "@/lib/utils";
import { springPresets } from "@/lib/utils/spring-presets";

type FadeInDirection = "up" | "down" | "left" | "right" | "scale";

interface FadeInProps {
  children: React.ReactNode;
  direction?: FadeInDirection;
  delay?: number;
  duration?: number;
  distance?: number;
  scaleDistance?: number;
  className?: string;
  as?: "div" | "span";
  role?: string;
  "aria-label"?: string;
  "aria-live"?: "off" | "assertive" | "polite";
}

export function FadeIn({
  children,
  direction = "up",
  delay = 0,
  duration: _duration,
  distance: _distance,
  scaleDistance: _scaleDistance,
  className,
  as: _as,
  ...rest
}: FadeInProps & Record<string, unknown>) {
  return (
    <m.div
      className={cn(className)}
      initial={{
        opacity: 0,
        y: direction === "up" || direction === "down" ? 12 : 0,
        x: direction === "left" ? -12 : direction === "right" ? 12 : 0,
        scale: direction === "scale" ? 0.95 : 1,
      }}
      animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
      transition={{ ...springPresets.fast, delay: delay || 0 }}
      {...rest}
    >
      {children}
    </m.div>
  );
}
