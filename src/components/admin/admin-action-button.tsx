"use client";

import RadialIcon from "@hugeicons/core-free-icons/RadialIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import * as m from "motion/react-m";
import { cn } from "@/lib/utils";

interface AdminActionButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "default" | "outline";
  icon?: React.ReactNode;
}

export function AdminActionButton({
  children,
  onClick,
  loading,
  disabled,
  variant = "default",
  icon,
}: AdminActionButtonProps) {
  return (
    <m.button
      onClick={onClick}
      disabled={loading || disabled}
      className={cn(
        "flex-1 rounded-md px-3 py-2 font-medium text-sm transition-[scale,opacity] disabled:opacity-50 hover:scale-[1.02] press-scale",
        variant === "default" ? "bg-foreground text-background" : "border bg-transparent",
      )}
    >
      <m.span
        animate={loading ? { opacity: 0.7 } : { opacity: 1 }}
        className="flex items-center justify-center gap-2"
      >
        {loading && <HugeiconsIcon icon={RadialIcon} className="size-3 animate-spin" />}
        {icon}
        {children}
      </m.span>
    </m.button>
  );
}
