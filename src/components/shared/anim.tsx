import type { ReactNode } from "react";

interface AnimProps {
  children: ReactNode;
  layoutId?: string;
  initial?: boolean;
  variants?: Record<string, unknown>;
  transition?: Record<string, unknown>;
  performanceAware?: boolean;
}

export function Anim({ children }: AnimProps) {
  return children;
}
