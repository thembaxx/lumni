"use client";

import { forwardRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SpringCardProps {
  children: ReactNode;
  className?: string;
  glass?: boolean;
}

export const SpringCard = forwardRef<HTMLDivElement, SpringCardProps>(
  ({ className, children, glass = true }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          glass && "glass-bento rounded-card-lg shadow-level-1",
          "bento-card",
          className,
        )}
      >
        {children}
      </div>
    );
  },
);
SpringCard.displayName = "SpringCard";
