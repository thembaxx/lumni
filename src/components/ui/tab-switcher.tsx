"use client";

import * as m from "motion/react-m";
import { useCallback, useEffect, useRef, useState } from "react";
import { Anim } from "@/components/shared/anim";
import { cn } from "@/lib/utils";
import { springPresets } from "@/lib/utils/spring-presets";

interface TabItem {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabSwitcherProps {
  tabs: TabItem[];
  value: string;
  onValueChange: (value: string) => void;
  variant?: "tabs" | "segmented";
  className?: string;
  listClassName?: string;
  children?: React.ReactNode;
}

export function TabSwitcher({
  tabs,
  value,
  onValueChange,
  variant = "tabs",
  className,
  listClassName,
  children,
}: TabSwitcherProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  const measure = useCallback(() => {
    if (!listRef.current) return;
    const buttons = listRef.current.querySelectorAll<HTMLButtonElement>(
      variant === "tabs" ? "button[data-tab]" : "button",
    );
    const activeIndex = tabs.findIndex((t) => t.value === value);
    const btn = buttons[activeIndex];
    if (!btn) return;
    const listRect = listRef.current.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    setIndicator({
      left: btnRect.left - listRect.left,
      width: btnRect.width,
    });
  }, [tabs, value, variant]);

  useEffect(() => {
    requestAnimationFrame(measure);
  }, [measure]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const currentIndex = tabs.findIndex((t) => t.value === value);
      let nextIndex: number | null = null;
      if (e.key === "ArrowRight") {
        nextIndex = (currentIndex + 1) % tabs.length;
      } else if (e.key === "ArrowLeft") {
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      }
      if (nextIndex !== null) {
        e.preventDefault();
        onValueChange(tabs[nextIndex].value);
      }
    },
    [tabs, value, onValueChange],
  );

  return (
    <Anim>
      <div className={cn("flex flex-col gap-2", className)}>
        <div
          ref={listRef}
          role="tablist"
          tabIndex={0}
          onKeyDown={handleKeyDown}
          className={cn(
            variant === "tabs"
              ? "relative inline-flex gap-1 rounded-lg bg-muted p-1"
              : // impeccable-disable-next-line arbitrary-value -- intentional tight tab indicator padding
                "relative inline-flex items-center rounded-md bg-(--system-surface-secondary) p-[3px]",
            listClassName,
          )}
        >
          {tabs.map((tab) => (
            <button
              key={tab.value}
              {...(variant === "tabs" ? { "data-tab": true } : {})}
              type="button"
              role="tab"
              aria-selected={value === tab.value}
              aria-controls={`tabpanel-${tab.value}`}
              onClick={() => onValueChange(tab.value)}
              className={cn(
                "press-scale relative z-elevated inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors duration-150",
                variant === "tabs"
                  ? "rounded-md px-4 py-2 font-medium text-sm"
                  : "flex-1 rounded-sm px-4 py-2 font-medium text-sm",
                variant === "tabs"
                  ? value === tab.value
                    ? "text-background"
                    : "text-muted-foreground hover:text-foreground"
                  : value === tab.value
                    ? "text-system-accent"
                    : "text-(--system-text-secondary) hover:text-(--system-text-primary)",
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
          <m.div
            className={
              variant === "tabs"
                ? "absolute inset-y-1 left-0 z-0 rounded-md bg-system-accent"
                : "absolute inset-y-[3px] left-0 z-0 rounded-sm bg-(--system-surface) shadow-level-1"
            }
            initial={false}
            animate={{
              x: indicator.left,
              width: indicator.width,
            }}
            transition={springPresets.cardExit}
          />
        </div>
        {variant === "tabs" && value && children}
      </div>
    </Anim>
  );
}
