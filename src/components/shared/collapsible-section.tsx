"use client";

import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useCallback, useState } from "react";
import { iOSEase } from "@/lib/utils/animation";

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  count?: number;
}

export function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
  count,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const toggle = useCallback(() => setOpen((v) => !v), []);

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={toggle}
        className="flex min-h-11 w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted/50 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-study-green/40"
        aria-expanded={open}
      >
        <span className="text-balance font-semibold text-muted-foreground text-xs uppercase tracking-wider">
          {title}
          {count !== undefined && (
            <span className="ml-1.5 font-normal text-muted-foreground/60">({count})</span>
          )}
        </span>
        <m.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2, ease: iOSEase }}>
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            className="size-4 text-muted-foreground/60"
            aria-hidden="true"
            data-icon
          />
        </m.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <m.div
            key="content"
            initial={{ opacity: 0, scaleY: 0.95 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0.95 }}
            transition={{ duration: 0.2, ease: iOSEase }}
            className="origin-top"
          >
            {children}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function CollapsibleSectionAlwaysOpen({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-4">{children}</div>;
}
