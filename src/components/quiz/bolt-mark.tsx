"use client";

import SparklesIcon from "@hugeicons/core-free-icons/SparklesIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import * as m from "motion/react-m";
import { iOSEase } from "@/lib/utils/animation";

export function BoltMark() {
  return (
    <m.div
      initial={{ scale: 0.6, rotate: -10, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: iOSEase }}
      className="relative flex size-10 shrink-0 items-center justify-center rounded-2xl bg-warning/15 shadow-level-1 ring-1 ring-warning/25"
      aria-hidden="true"
    >
      <m.div
        animate={{ scale: [1, 1.06, 1], opacity: [0.55, 0.85, 0.55] }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        className="absolute inset-0 rounded-2xl bg-warning/30 blur-md"
      />
      <HugeiconsIcon
        icon={SparklesIcon}
        className="relative size-5 text-warning"
        strokeWidth={2.25}
      />
    </m.div>
  );
}
