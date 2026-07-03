"use client";

import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
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
        className="flex min-h-11 w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-study-green/40"
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
          />
        </m.div>
      </button>
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-200 ease-(--ease-ios-decelerate) ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="min-h-0 overflow-hidden opacity-0 transition-opacity duration-200">
          {children}
        </div>
      </div>
    </div>
  );
}

export function CollapsibleSectionAlwaysOpen({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-4">{children}</div>;
}
