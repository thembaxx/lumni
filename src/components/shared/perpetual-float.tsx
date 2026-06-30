"use client";

import { memo, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";

interface PerpetualFloatProps {
  children: ReactNode;
  className?: string;
}

export const PerpetualFloat = memo(function PerpetualFloat({
  children,
  className,
}: PerpetualFloatProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <m.div
      animate={{ y: [0, -8, 0] }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={className}
    >
      {children}
    </m.div>
  );
});
