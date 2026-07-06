"use client";

import { cn } from "@/lib/utils";

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

const entranceClass: Record<FadeInDirection, string> = {
  up: "card-entrance",
  down: "card-entrance-down",
  left: "card-entrance-sm",
  right: "card-entrance-sm",
  scale: "card-entrance-sm",
};

export function FadeIn({
  children,
  direction = "up",
  delay = 0,
  _duration,
  _distance,
  _scaleDistance,
  className,
  as = "div",
  ...rest
}: FadeInProps & Record<string, unknown>) {
  const cls = entranceClass[direction];
  const Tag = as === "span" ? "span" : "div";

  return (
    <Tag
      className={cn(cls, className)}
      style={delay ? { animationDelay: `${delay}s` } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  );
}
