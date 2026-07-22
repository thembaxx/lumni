"use client";

import * as m from "motion/react-m";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface Segment {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface SegmentedControlProps {
  segments: Segment[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

export function SegmentedControl({
  segments,
  value,
  onValueChange,
  className,
}: SegmentedControlProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  const measure = useCallback(() => {
    if (!listRef.current) return;
    const buttons = listRef.current.querySelectorAll<HTMLButtonElement>("button");
    const activeIndex = segments.findIndex((s) => s.value === value);
    const btn = buttons[activeIndex];
    if (!btn) return;
    const listRect = listRef.current.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    setIndicator({
      left: btnRect.left - listRect.left,
      width: btnRect.width,
    });
  }, [segments, value]);

  useEffect(() => {
    requestAnimationFrame(measure);
  }, [measure]);

  return (
    <div
      ref={listRef}
      role="tablist"
      className={cn(
        "relative inline-flex items-center rounded-lg bg-(--system-surface-secondary) p-[3px]",
        className,
      )}
    >
      {segments.map((segment) => (
        <button
          key={segment.value}
          type="button"
          role="tab"
          aria-selected={value === segment.value}
          onClick={() => onValueChange(segment.value)}
          className={cn(
            "relative z-elevated flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-sm px-4 py-2 font-medium text-sm transition-colors duration-150",
            value === segment.value
              ? "text-system-accent"
              : "text-(--system-text-secondary) hover:text-(--system-text-primary)",
          )}
        >
          {segment.icon}
          {segment.label}
        </button>
      ))}
      <m.div
        className="pointer-events-none absolute inset-y-[3px] left-0 z-0 rounded-sm bg-(--system-surface) shadow-level-1"
        initial={false}
        animate={{
          x: indicator.left,
        }}
        style={{ width: indicator.width }}
        transition={{ type: "spring", stiffness: 500, damping: 35, mass: 1 }}
      />
    </div>
  );
}
