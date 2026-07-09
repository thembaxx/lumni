"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import * as m from "motion/react-m";
import { useReducedMotion } from "motion/react";
import { memo } from "react";
import type { IconSvgElement } from "@hugeicons/react";
import { springPresets } from "@/lib/utils/spring-presets";

interface ToolCardProps {
  label: string;
  description: string;
  href: string;
  icon: IconSvgElement;
  index: number;
  secret?: boolean;
}

const SPRING = springPresets.fast;

export const ToolCard = memo(function ToolCard({
  label,
  description,
  href,
  icon,
  index,
  secret,
}: ToolCardProps) {
  const reduce = useReducedMotion();

  return (
    <m.div
      initial={reduce ? { opacity: 1 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING, delay: Math.min(index * 0.04, 0.3) }}
      whileHover={reduce ? undefined : { scale: 1.015 }}
      className="group relative"
    >
      <Link
        href={href}
        aria-label={`${label} — ${description}`}
        className={
          "relative block rounded-card-lg border p-5 shadow-level-2 outline-none transition-[box-shadow,background-color,border-color] duration-300 focus-visible:ring-2 focus-visible:ring-system-accent hover:shadow-level-3 " +
          (secret
            ? "border-system-accent/40 bg-system-accent/5"
            : "border-border/60 bg-card hover:border-border")
        }
      >
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary transition-colors duration-300 group-hover:bg-muted">
            <HugeiconsIcon
              icon={icon}
              className="size-6 text-foreground transition-transform duration-300 group-hover:scale-110"
            />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground text-sm">{label}</h3>
            <p className="mt-0.5 text-muted-foreground text-xs leading-relaxed">{description}</p>
          </div>
        </div>
      </Link>
    </m.div>
  );
});
