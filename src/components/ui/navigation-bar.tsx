"use client";

import ArrowLeft01Icon from "@hugeicons/core-free-icons/ArrowLeft01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMotionValueEvent, useScroll } from "motion/react";
import * as m from "motion/react-m";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface NavigationBarProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  bottomSection?: React.ReactNode;
  className?: string;
}

export function NavigationBar({
  title,
  subtitle,
  showBack,
  rightAction,
  bottomSection,
  className,
}: NavigationBarProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsCollapsed(latest > 20);
  });

  return (
    <header
      ref={ref}
      className={cn(
        "sticky top-0 z-sticky w-full transition-[box-shadow] duration-200",
        isCollapsed ? "shadow-sm" : "",
        className,
      )}
    >
      {/* Background layer */}
      <div
        className={cn(
          "absolute inset-0 transition-[background-color,backdrop-filter] duration-200",
          isCollapsed ? "bg-system-background/90 backdrop-blur-xl" : "bg-system-background/0",
        )}
      />

      {/* Separator — appears when collapsed */}
      <m.div
        className="absolute right-0 bottom-0 left-0 h-px bg-system-separator/30"
        animate={{ opacity: isCollapsed ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      />

      {/* Content */}
      <div className="relative px-4 pt-safe">
        {/* Main row */}
        <div className="flex h-14 items-center gap-3">
          {/* Back button */}
          {showBack && (
            <button
              type="button"
              onClick={() => window.history.back()}
              className="-ml-1.5 flex size-9 items-center justify-center text-system-accent transition-opacity active:opacity-60"
              aria-label="Go back"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} className="size-5" strokeWidth={2} data-icon />
            </button>
          )}

          {/* Title area */}
          <div className="min-w-0 flex-1">
            <m.h1
              className={cn(
                "truncate font-bold font-heading text-system-text-primary transition-[font-size,line-height] duration-200",
                isCollapsed
                  ? "text-base leading-6"
                  : "text-(--fs-large-title) leading-[1.2] tracking-(--tracking-large-title)",
              )}
            >
              {title}
            </m.h1>
            {subtitle && !isCollapsed && (
              <p className="mt-0.5 text-sm text-system-text-secondary">{subtitle}</p>
            )}
          </div>

          {/* Right action */}
          {rightAction && <div className="flex shrink-0 items-center gap-2">{rightAction}</div>}
        </div>

        {/* Bottom section (e.g., tabs, search) */}
        {bottomSection && (
          <div className={cn("pb-2", isCollapsed && "hidden")}>{bottomSection}</div>
        )}
      </div>
    </header>
  );
}
