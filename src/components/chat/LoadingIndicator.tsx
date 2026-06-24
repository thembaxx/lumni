import { HugeiconsIcon } from "@hugeicons/react";
import SparklesIcon from "@hugeicons/core-free-icons/SparklesIcon";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useEffect, useState } from "react";
import { FadeIn } from "@/components/shared/fade-in";

const LOADING_MESSAGES = ["Thinking…", "Finding the right words…", "Just a sec…"] as const;

const MESSAGE_ROTATION_INTERVAL_MS = 2500;

export function LoadingIndicator() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, MESSAGE_ROTATION_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return (
    <FadeIn
      direction="up"
      distance={10}
      role="status"
      aria-live="polite"
      className="flex items-center gap-3 rounded-xl border border-border/40 bg-system-surface-secondary p-4 text-muted-foreground shadow-level-1"
    >
      <m.div
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        className="flex size-7 shrink-0 items-center justify-center"
      >
        <HugeiconsIcon icon={SparklesIcon} className="size-6 text-system-accent" />
      </m.div>
      <AnimatePresence mode="wait" initial={false}>
        <m.span
          key={messageIndex}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className="font-extrabold text-xs uppercase tracking-widest"
        >
          {LOADING_MESSAGES[messageIndex]}
        </m.span>
      </AnimatePresence>
    </FadeIn>
  );
}
