"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Scroll-triggered reveal. Fades + lifts children into view once, using an
 * IntersectionObserver. Respects reduced motion via the CSS transition guard.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 24,
  as: Tag = "div",
  once = true,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  as?: "div" | "section" | "li" | "article" | "span";
  once?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          if (once) io.disconnect();
        } else if (!once) {
          setShown(false);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [once]);

  return (
    <Tag
      ref={ref as never}
      className={cn(
        "transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform",
        shown ? "opacity-100 translate-y-0" : "opacity-0",
        className,
      )}
      style={
        {
          transform: shown ? "translateY(0)" : `translateY(${y}px)`,
          transitionDelay: `${delay}ms`,
        } as CSSProperties
      }
    >
      {children}
    </Tag>
  );
}

/**
 * Card with a cursor-tracking spotlight glow. The glow follows the pointer and
 * fades out on leave. Stack with glass/tilt surfaces for depth.
 */
export function SpotlightCard({
  children,
  className,
  radius = 340,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  radius?: number;
  as?: "div" | "article" | "section";
}) {
  const ref = useRef<HTMLElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ x: e.clientX - r.left, y: e.clientY - r.top });
  };

  return (
    <Tag
      ref={ref as never}
      onMouseMove={onMove}
      onMouseLeave={() => setPos(null)}
      className={cn("relative overflow-hidden", className)}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300"
        style={{
          opacity: pos ? 1 : 0,
          background: pos
            ? `radial-gradient(${radius}px circle at ${pos.x}px ${pos.y}px, var(--system-accent-alpha-10), transparent 70%)`
            : undefined,
        }}
      />
      {children}
    </Tag>
  );
}

/** Animated gradient-text headline. */
export function GradientText({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("animate-text-shimmer font-bold", className)}>{children}</span>;
}
