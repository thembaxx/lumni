"use client";

import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { iOSEase } from "@/lib/utils/animation";

export function SectionReveal({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const { ref, hasRevealed } = useScrollReveal<HTMLDivElement>({ once: true });
  const shouldReduceMotion = useReducedMotion();

  return (
    <m.div
      ref={ref}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{
        opacity: shouldReduceMotion || hasRevealed ? 1 : 0,
        y: shouldReduceMotion || hasRevealed ? 0 : 16,
      }}
      transition={{
        duration: 0.4,
        ease: iOSEase,
        delay: shouldReduceMotion ? 0 : delay,
      }}
    >
      {children}
    </m.div>
  );
}
