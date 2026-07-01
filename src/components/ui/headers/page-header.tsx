"use client";

import { cn } from "@/lib/utils";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  leftSection?: React.ReactNode;
  rightSection?: React.ReactNode;
  bottomSection?: React.ReactNode;
  className?: string;
}

function PageHeader({
  title,
  subtitle,
  leftSection,
  rightSection,
  bottomSection,
  className,
}: PageHeaderProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <m.header
      initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 28, mass: 0.5, bounce: 0 }}
      className={cn(
        "sticky top-0 z-elevated flex flex-col gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className,
      )}
    >
      <div className="flex h-14 items-center gap-3 px-4">
        {leftSection && <div className="shrink-0">{leftSection}</div>}
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <h1 className="truncate font-heading font-semibold text-foreground text-lg">{title}</h1>
          {subtitle && <p className="truncate text-muted-foreground text-xs">{subtitle}</p>}
        </div>
        {rightSection && (
          <div className="ml-auto flex shrink-0 items-center gap-2">{rightSection}</div>
        )}
      </div>
      {bottomSection && <div className="px-4 pb-2">{bottomSection}</div>}
    </m.header>
  );
}

export { PageHeader };
