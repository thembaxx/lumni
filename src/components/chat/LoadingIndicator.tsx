import RadialIcon from "@hugeicons/core-free-icons/RadialIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useEffect, useState } from "react";

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
    <m.div
      role="status"
      aria-live="polite"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 rounded-lg border border-border/40 bg-system-surface-secondary p-4 text-muted-foreground shadow-sm"
    >
      <div className="size-7 shrink-0">
        <m.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          className="size-full"
        >
          <HugeiconsIcon icon={RadialIcon} className="size-7 text-muted-foreground" />
        </m.div>
      </div>
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
    </m.div>
  );
}
