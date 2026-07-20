"use client";

import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { forwardRef, type ReactNode } from "react";
import { springPresets } from "@/lib/utils/spring-presets";
import { cn } from "@/lib/utils";

interface SpringCardProps {
  children: ReactNode;
  className?: string;
  index?: number;
  glass?: boolean;
  noAnimation?: boolean;
}

export const SpringCard = forwardRef<HTMLDivElement, SpringCardProps>(
  ({ className, children, index = 0, glass = true, noAnimation }, ref) => {
    const prefersReducedMotion = useReducedMotion();

    const baseClass = cn(
      glass && "glass-bento rounded-card-lg shadow-level-1",
      "bento-card",
      className,
    );

    if (noAnimation || prefersReducedMotion) {
      return (
        <div ref={ref} className={baseClass}>
          {children}
        </div>
      );
    }

    return (
      <m.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          ...springPresets.standard,
          delay: index * 0.04,
        }}
        className={baseClass}
      >
        {children}
      </m.div>
    );
  },
);
SpringCard.displayName = "SpringCard";
