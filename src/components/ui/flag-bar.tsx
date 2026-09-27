import type * as React from "react";
import { cn } from "@/lib/utils";

export interface FlagBarProps extends React.ComponentProps<"div"> {
  height?: number;
}

export function FlagBar({ className, height = 8, ...props }: FlagBarProps) {
  return (
    <div
      role="region"
      aria-label="South African Flag Rule"
      className={cn("w-full flex overflow-hidden", className)}
      style={{ height: `${height}px` }}
      {...props}
    >
      <span className="h-full bg-[var(--accent-green)] flex-1" />
      <span className="h-full bg-[var(--accent-gold)] flex-1" />
      <span className="h-full bg-[var(--fg)] flex-1" />
      <span className="h-full bg-[var(--accent-red)] flex-1" />
    </div>
  );
}
