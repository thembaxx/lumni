"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BentoCardProps {
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "wide" | "tall" | "full";
  variant?: "default" | "glass" | "accent" | "elevated";
  as?: "div" | "section" | "article";
}

const SIZE_CLASSES = {
  sm: "",
  md: "bento-wide",
  lg: "bento-large",
  wide: "bento-wide",
  tall: "bento-tall",
  full: "bento-full",
};

const VARIANT_CLASSES = {
  default: "bg-card border-border hover:border-accent/20",
  glass: "glass-card border-border/50 hover:border-accent/30",
  accent: "bg-primary/5 border-primary/10 hover:border-primary/20",
  elevated: "bg-card border-border/40 shadow-level-1 hover:shadow-level-2",
};

export function BentoCard({
  children,
  className,
  size = "sm",
  variant = "default",
  as: Tag = "div",
}: BentoCardProps) {
  return (
    <Tag className={cn("bento-tile p-5", SIZE_CLASSES[size], VARIANT_CLASSES[variant], className)}>
      {children}
    </Tag>
  );
}
