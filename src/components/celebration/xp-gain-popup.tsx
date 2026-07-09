"use client";

import SparklesIcon from "@hugeicons/core-free-icons/SparklesIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";

interface XPGainPopupProps {
  amount: number;
  visible: boolean;
}

export function XPGainPopup({ amount, visible }: XPGainPopupProps) {
  return (
    <AnimatePresence initial={false}>
      {visible && (
        <m.div
          initial={{ opacity: 0, y: 20, scale: 0.5 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 400, damping: 26, bounce: 0 }}
          className="pointer-events-none fixed top-1/2 left-1/2 z-modal -translate-x-1/2 -translate-y-1/2 motion-reduce:animate-none motion-reduce:transition-none"
        >
          <div className="flex items-center gap-2 rounded-full bg-warning px-6 py-3 text-primary-foreground shadow-level-2">
            <HugeiconsIcon icon={SparklesIcon} className="size-5" />
            <span className="font-bold text-xl tabular-nums">+{amount} XP</span>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
