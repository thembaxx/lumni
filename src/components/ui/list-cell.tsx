"use client";

import type * as React from "react";

import { cn } from "@/lib/utils";
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
  leading: _leading,
  title,
  subtitle,
  trailing,
  onClick,
  className,
  showSeparator = true,
  destructive = false,
  disabled = false,
}: ListCellProps) {
  const Component = onClick ? "button" : "div";

  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex min-h-14 w-full items-center gap-4 px-5 py-4 text-left",
        "bg-(--system-surface) transition-[background-color,scale] duration-200",
        onClick &&
          "hover:bg-(--system-surface-secondary) active:scale-[0.96] active:bg-(--system-surface-secondary)",
        disabled && "opacity-50",
        showSeparator && "ios-separator",
        className,
      )}
    >
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
    </Component>
  );
}

export { ListCell };
