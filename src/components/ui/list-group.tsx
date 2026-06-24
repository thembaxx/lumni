import type * as React from "react";
import { cn } from "@/lib/utils";

interface ListGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function ListGroup({ children, className }: ListGroupProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl bg-(--system-surface)",
        "border border-border/60 shadow-level-1",
        className,
      )}
    >
      {children}
    </div>
  );
}
