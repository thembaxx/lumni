"use client";

import { useReducedMotion } from "motion/react";
import { useCallback, useRef, type MouseEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MagneticCardProps {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
  perspective?: number;
  scaleOnHover?: number;
  as?: "div" | "button" | "article";
  onClick?: () => void;
}

/**
 * 3D magnetic tilt card that follows mouse position.
 * 2026 trend: spatial depth through perspective transforms.
 * Desktop-only: respects reduced motion, no touch interference.
 */
export function MagneticCard({
  children,
  className,
  maxTilt = 8,
  perspective = 800,
  scaleOnHover = 1.02,
  as: Tag = "div",
  onClick,
}: MagneticCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef<HTMLElement>(null);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (prefersReducedMotion || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      ref.current.style.transform = `perspective(${perspective}px) rotateY(${x * maxTilt}deg) rotateX(${-y * maxTilt}deg) scale3d(${scaleOnHover}, ${scaleOnHover}, ${scaleOnHover})`;
    },
    [prefersReducedMotion, maxTilt, perspective, scaleOnHover],
  );

  const handleMouseLeave = useCallback(() => {
    if (!ref.current) return;
    ref.current.style.transform = `perspective(${perspective}px) rotateY(0deg) rotateX(0deg) scale3d(1, 1, 1)`;
  }, [perspective]);

  const Component = Tag as React.ElementType;
  return (
    <Component
      ref={ref as React.Ref<HTMLElement>}
      className={cn(
        "tilt-card will-change-transform transition-transform duration-[400ms] motion-reduce:transition-none",
        onClick && "press-scale cursor-pointer",
        className,
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e: React.KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      style={{ transformStyle: "preserve-3d" }}
    >
      {children}
    </Component>
  );
}
