"use client";

import * as m from "motion/react-m";
import { iOSEase } from "@/lib/utils/animation";

interface AnimatedCardProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function AnimatedCard({ children, delay = 0, className }: AnimatedCardProps) {
  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: iOSEase }}
      className={className}
    >
      {children}
    </m.div>
  );
}
