"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

type MeshVariant = "hero" | "dashboard" | "quiz" | "celebrate";

const PALETTES: Record<MeshVariant, string[]> = {
  hero: [
    "oklch(55% 0.26 146 / 0.20)",
    "oklch(72% 0.28 55 / 0.14)",
    "oklch(58% 0.28 265 / 0.12)",
    "oklch(68% 0.26 145 / 0.10)",
  ],
  dashboard: [
    "oklch(55% 0.26 146 / 0.12)",
    "oklch(72% 0.28 55 / 0.08)",
    "oklch(58% 0.28 265 / 0.07)",
  ],
  quiz: ["oklch(55% 0.26 146 / 0.10)", "oklch(72% 0.28 55 / 0.06)", "oklch(58% 0.28 265 / 0.05)"],
  celebrate: [
    "oklch(62% 0.24 350 / 0.18)",
    "oklch(59% 0.23 290 / 0.16)",
    "oklch(68% 0.26 145 / 0.14)",
    "oklch(72% 0.28 55 / 0.12)",
  ],
};

interface MeshAuroraProps {
  className?: string;
  variant?: MeshVariant;
  interactive?: boolean;
  /** Multiplies blob opacity for a more striking look. */
  intensity?: number;
}

/**
 * Cinematic mesh-gradient aurora. Layered radial blobs drift slowly while a
 * cursor-reactive light tracks the pointer. Pure CSS motion + a single
 * pointermove listener; fully disabled under prefers-reduced-motion.
 */
export function MeshAurora({
  className,
  variant = "hero",
  interactive = true,
  intensity = 1,
}: MeshAuroraProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pointer, setPointer] = useState({ x: 50, y: 30 });
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setEnabled(false);
      return;
    }
    setEnabled(true);
    if (!interactive) return;
    const onMove = (e: PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setPointer({
        x: ((e.clientX - r.left) / r.width) * 100,
        y: ((e.clientY - r.top) / r.height) * 100,
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [interactive]);

  const colors = PALETTES[variant];
  const blobs = [
    {
      pos: { top: "-20%", left: "-15%" },
      size: "60vw",
      anim: "animate-aurora-wave",
      dur: "20s",
      c: colors[0],
    },
    {
      pos: { top: "10%", right: "-20%" },
      size: "55vw",
      anim: "animate-float-sway",
      dur: "24s",
      c: colors[1],
    },
    {
      pos: { bottom: "-25%", left: "10%" },
      size: "50vw",
      anim: "animate-aurora-wave",
      dur: "28s",
      c: colors[2],
    },
    {
      pos: { bottom: "5%", right: "5%" },
      size: "40vw",
      anim: "animate-float-sway",
      dur: "22s",
      c: colors[3] ?? colors[0],
    },
  ];

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      {blobs.map((b, i) => (
        <div
          key={i}
          className={cn(
            "absolute rounded-full blur-[90px] will-change-transform",
            enabled && b.anim,
          )}
          style={
            {
              ...b.pos,
              width: b.size,
              height: b.size,
              background: b.c,
              opacity: intensity,
              animationDuration: b.dur,
              animationDelay: `${i * -3}s`,
            } as CSSProperties
          }
        />
      ))}
      {interactive && enabled && (
        <div
          className="absolute inset-0 transition-opacity duration-500"
          style={{
            background: `radial-gradient(620px circle at ${pointer.x}% ${pointer.y}%, var(--system-accent-alpha-10), transparent 60%)`,
          }}
        />
      )}
      <div
        className="absolute inset-0 opacity-[0.025] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
