"use client";

import type * as React from "react";

import { cn } from "@/lib/utils";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { ListGroup } from "./list-group";
import { ListSection } from "./list-section";

export { ListGroup, ListSection };

interface ListCellProps {
  leading?: React.ReactNode;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  showSeparator?: boolean;
  destructive?: boolean;
  disabled?: boolean;
}

function ListCell({
  title,
  subtitle,
  trailing,
  onClick,
  className,
  showSeparator = true,
  destructive = false,
  disabled = false,
}: ListCellProps) {
  const inner = (
    <>
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "text-(length:--fs-body) truncate font-medium text-foreground text-sm",
            destructive && "text-(--system-destructive)",
          )}
        >
          {title}
        </div>
        {subtitle && (
          <div className="text-(length:--fs-footnote) mt-0.5 font-medium text-(--system-text-secondary) text-sm leading-snug">
            {subtitle}
          </div>
        )}
      </div>
      {trailing && <div className="flex shrink-0 items-center">{trailing}</div>}
    </>
  );

  const prefersReducedMotion = useReducedMotion();

  if (onClick) {
    return (
      <m.button
        type="button"
        onClick={onClick}
        disabled={disabled}
        whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
        transition={{ type: "spring", stiffness: 400, damping: 26, bounce: 0 }}
        className={cn(
          "flex min-h-14 w-full items-center gap-4 px-5 py-4 text-left",
          "bg-(--system-surface) transition-[background-color] duration-200",
          "hover:bg-(--system-surface-secondary) active:bg-(--system-surface-secondary)",
          disabled && "opacity-50",
          showSeparator && "ios-separator",
          className,
        )}
      >
        {inner}
      </m.button>
    );
  }

  return (
    <div
      className={cn(
        "flex min-h-14 w-full items-center gap-4 px-5 py-4 text-left",
        "bg-(--system-surface)",
        disabled && "opacity-50",
        showSeparator && "ios-separator",
        className,
      )}
    >
      {inner}
    </div>
  );
}

export { ListCell };
