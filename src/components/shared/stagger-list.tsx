"use client";

import { AnimatePresence, type Variants } from "motion/react";
import * as m from "motion/react-m";
import { cn } from "@/lib/utils";
import { useOptimizedAnimation } from "@/lib/utils/animation-optimization";

interface StaggerListProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  variants?: Variants;
  performanceAware?: boolean;
}

export function StaggerList({
  children,
  className,
  delay = 0.06,
  variants,
  performanceAware = false,
}: StaggerListProps) {
  const animOpts = useOptimizedAnimation();
  const shouldReduce = performanceAware ? (animOpts?.shouldReduceMotion ?? false) : false;

  if (shouldReduce) {
    return <div className={cn("flex flex-col gap-0", className)}>{children}</div>;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <m.div
        className={cn("flex flex-col gap-0", className)}
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={
          variants ?? {
            visible: {
              transition: {
                staggerChildren: delay,
              },
            },
            exit: {
              transition: {
                staggerChildren: 0.03,
                staggerDirection: -1,
              },
            },
          }
        }
      >
        {children}
      </m.div>
    </AnimatePresence>
  );
}

const _defaultItemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    y: 4,
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
  },
};
