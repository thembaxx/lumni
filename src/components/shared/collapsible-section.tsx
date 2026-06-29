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
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center justify-between rounded-lg px-1 py-1.5 text-left transition-colors hover:bg-muted/50"
        aria-expanded={open}
      >
        <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
          {title}
          {count !== undefined && (
            <span className="ml-1.5 font-normal text-muted-foreground/60">({count})</span>
          )}
        </span>
        <m.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2, ease: iOSEase }}>
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            className="size-3.5 text-muted-foreground/60"
            aria-hidden="true"
          />
        </m.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <m.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: iOSEase }}
            className="flex flex-col gap-3 overflow-hidden"
          >
            {children}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function CollapsibleSectionAlwaysOpen({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-3">{children}</div>;
}
