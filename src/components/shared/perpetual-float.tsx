"use client";

import { memo, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PerpetualFloatProps {
  children: ReactNode;
  className?: string;
  floatRange?: number;
  speed?: number;
  duration?: number;
  offsetY?: number;
  cycles?: number;
}

export const PerpetualFloat = memo(function PerpetualFloat({
  children,
  className,
}: PerpetualFloatProps) {
  return (
    <div className={cn("animate-float-slow will-change-transform", className)}>{children}</div>
  );
});
