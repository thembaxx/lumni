"use client";

import ChartDownIcon from "@hugeicons/core-free-icons/ChartDownIcon";
import ChartUpIcon from "@hugeicons/core-free-icons/ChartUpIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { cn } from "@/lib/utils";
import { iOSEase } from "@/lib/utils/animation";

export type StatCardVariant = "default" | "admin" | "dashboard";

interface StatCardProps {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  trend?: "up" | "down" | "neutral";
  colorClass?: string;
  bgClass?: string;
  variant?: StatCardVariant;
  className?: string;
  delay?: number;
}

const trendColors = {
  up: "text-success",
  down: "text-destructive",
  neutral: "text-muted-foreground",
};

export function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  colorClass = "text-foreground",
  bgClass = "bg-(--system-accent)/10",
  variant = "default",
  className,
  delay = 0,
}: StatCardProps) {
  const trendColor = trend ? trendColors[trend] : undefined;

  if (variant === "admin") {
    return (
      <m.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay, duration: 0.3, ease: iOSEase }}
        className={cn("rounded-lg bg-muted/50 p-3", className)}
      >
        <p className="text-muted-foreground text-xs">{label}</p>
        <m.p
          className="font-semibold text-xl tabular-nums"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.15 }}
        >
          {value}
        </m.p>
      </m.div>
    );
  }

  const prefersReducedMotion = useReducedMotion();

  if (variant === "dashboard") {
    return (
      <m.div
        whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
        whileTap={prefersReducedMotion ? undefined : { scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 26 }}
        className={cn(
          "flex flex-col items-center justify-center gap-2 overflow-hidden rounded-card-lg border border-border/80 bg-card p-4 shadow-level-2",
          className,
        )}
      >
        <m.div
          className={cn("rounded-full p-2", bgClass)}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            delay: delay + 0.2,
            type: "spring",
            stiffness: 300,
            damping: 26,
            bounce: 0,
          }}
        >
          {Icon && <Icon className={cn("size-5", colorClass)} />}
        </m.div>
        <m.div
          className="text-center"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay + 0.3 }}
        >
          <span className="text-muted-foreground text-xs">{label}</span>
        </m.div>
        <m.span
          className={cn("font-extrabold text-xl tabular-nums", colorClass)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.35 }}
        >
          {value}
        </m.span>
      </m.div>
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-card-lg border border-border/80 bg-card shadow-level-2 transition-colors",
        className,
      )}
    >
      <div className="p-4">
        <div className="mb-2 flex items-center gap-2 text-muted-foreground">
          {Icon && <Icon className="size-4" />}
          <span className="text-xs">{label}</span>
        </div>
        <div
          className={cn("flex items-center gap-2 font-extrabold text-2xl tabular-nums", trendColor)}
        >
          {value}
          {trend === "up" && <HugeiconsIcon icon={ChartUpIcon} className="size-4" />}
          {trend === "down" && <HugeiconsIcon icon={ChartDownIcon} className="size-4" />}
        </div>
      </div>
    </div>
  );
}
