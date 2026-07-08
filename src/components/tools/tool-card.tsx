"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import * as m from "motion/react-m";
import { useMotionValue, useSpring, useTransform } from "motion/react";
import { useRef, useCallback, memo } from "react";
import type { IconSvgElement } from "@hugeicons/react";

interface ToolCardProps {
  label: string;
  description: string;
  href: string;
  icon: IconSvgElement;
  index: number;
  zoneIndex: number;
  totalItems: number;
  onShiftClick?: () => void;
  secret?: boolean;
}

export const ToolCard = memo(function ToolCard({
  label,
  description,
  href,
  icon,
  index,
  zoneIndex,
  onShiftClick,
  secret,
}: ToolCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const spring = { stiffness: 300, damping: 25, mass: 1 };
  const rx = useSpring(useTransform(y, [0, 1], [6, -6]), spring);
  const ry = useSpring(useTransform(x, [0, 1], [-6, 6]), spring);
  const gx = useSpring(useTransform(x, [0, 1], [0, 100]), spring);
  const gy = useSpring(useTransform(y, [0, 1], [0, 100]), spring);

  const onMove = useCallback(
    (e: React.MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      x.set(((e.clientX - r.left) / r.width) * 0.8 + 0.1);
      y.set(((e.clientY - r.top) / r.height) * 0.8 + 0.1);
    },
    [x, y],
  );

  const onLeave = useCallback(() => {
    x.set(0.5);
    y.set(0.5);
  }, [x, y]);

  const onClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.shiftKey && onShiftClick) {
        e.preventDefault();
        onShiftClick();
      }
    },
    [onShiftClick],
  );

  return (
    <m.div
      ref={ref}
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: zoneIndex * 0.08 + index * 0.035,
        type: "spring",
        stiffness: 250,
        damping: 22,
        mass: 1,
      }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      style={
        {
          rotateX: rx,
          rotateY: ry,
          transformStyle: "preserve-3d",
          perspective: 800,
        } as React.CSSProperties
      }
      className="group relative"
    >
      <Link
        href={href}
        onClick={onClick}
        className={
          "relative block rounded-card-lg border p-5 shadow-level-2 outline-none transition-[box-shadow] duration-300 focus-visible:ring-2 focus-visible:ring-system-accent hover:shadow-level-3 " +
          (secret ? "border-system-accent/40 bg-system-accent/5" : "border-border/60 bg-card")
        }
      >
        <div
          className="pointer-events-none absolute inset-0 rounded-card-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `radial-gradient(circle at ${gx}% ${gy}%, var(--system-accent)/0.12, transparent 65%)`,
          }}
        />
        <div className="flex items-start gap-4" style={{ transform: "translateZ(24px)" }}>
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-system-accent/10 transition-all duration-300 group-hover:bg-system-accent/15">
            <HugeiconsIcon
              icon={icon}
              className="size-6 text-system-accent transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-5deg]"
            />
          </div>
          <div className="min-w-0">
            <h3
              className="font-semibold text-foreground text-sm"
              style={{ transform: "translateZ(32px)" }}
            >
              {label}
            </h3>
            <p className="mt-0.5 text-muted-foreground text-xs leading-relaxed">{description}</p>
          </div>
        </div>
      </Link>
    </m.div>
  );
});
