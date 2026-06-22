"use client";

import { AnimatePresence, type Variants } from "motion/react";
import * as m from "motion/react-m";
import { cn } from "@/lib/utils";

interface StaggerListProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  variants?: Variants;
}

export function StaggerList({ children, className, delay = 0.06, variants }: StaggerListProps) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <m.div
        className={cn("flex flex-col gap-0", className)}
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={
          variants ?? {
            visible: {
              transition: {
                staggerChildren: delay,
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
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  },
};
