"use client";

import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface BentoGridProps extends HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3;
}

export function BentoGrid({ className, children, cols = 3, ...props }: BentoGridProps) {
  return (
    <div
      className={cn(
        "grid gap-3 sm:gap-4",
        cols === 1 && "grid-cols-1",
        cols === 2 && "grid-cols-1 sm:grid-cols-2",
        cols === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function BentoCell({
  className,
  children,
  span,
  ...props
}: HTMLAttributes<HTMLDivElement> & { span?: "full" | "2col" | "2row" }) {
  return (
    <div
      className={cn(
        span === "full" && "sm:col-span-2 lg:col-span-3",
        span === "2col" && "lg:col-span-2",
        span === "2row" && "row-span-2",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
