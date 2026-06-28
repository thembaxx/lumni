"use client";

import { useEffect, useState } from "react";

interface PhaseStop {
  offset: number;
  l: number;
  c: number;
  h: number;
}

const PHASES: PhaseStop[] = [
  { offset: 0, l: 55, c: 0.18, h: 264 },
  { offset: 0.25, l: 55, c: 0.18, h: 264 },
  { offset: 0.5, l: 75, c: 0.15, h: 70 },
  { offset: 0.75, l: 55, c: 0.18, h: 25 },
  { offset: 1, l: 55, c: 0.18, h: 25 },
];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function interpolatePhase(stops: PhaseStop[], t: number): string {
  const clamped = Math.min(1, Math.max(0, t));
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    if (clamped >= a.offset && clamped <= b.offset) {
      const range = b.offset - a.offset;
      const local = range === 0 ? 0 : (clamped - a.offset) / range;
      return `oklch(${lerp(a.l, b.l, local).toFixed(1)}% ${lerp(a.c, b.c, local).toFixed(3)} ${lerp(a.h, b.h, local).toFixed(1)})`;
    }
  }
  return `oklch(${stops[stops.length - 1].l}% ${stops[stops.length - 1].c} ${stops[stops.length - 1].h})`;
}

export function ScrollAmbient() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false);

  useEffect(() => {
    setShouldReduceMotion(
      typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  }, []);

  useEffect(() => {
    if (shouldReduceMotion) return;

    const container = document.querySelector("[data-scroll-container]");
    if (!container) return;

    function update() {
      const { scrollTop, scrollHeight, clientHeight } = container as HTMLElement;
      const maxScroll = Math.max(1, scrollHeight - clientHeight);
      setScrollProgress(Math.min(1, scrollTop / maxScroll));
    }

    container.addEventListener("scroll", update, { passive: true });
    update();
    return () => container.removeEventListener("scroll", update);
  }, [shouldReduceMotion]);

  const color1 = interpolatePhase(PHASES, scrollProgress);
  const color2 = interpolatePhase(
    PHASES.map((p) => ({ ...p, h: p.h + 30 })),
    scrollProgress,
  );

  if (shouldReduceMotion) return null;

  return (
    <div className="pointer-events-none fixed inset-0 transition-none" aria-hidden="true">
      <div
        className="absolute -top-24 right-0 h-3/5 w-1/2 rounded-full blur-3xl transition-none"
        style={{ background: color1, opacity: 0.12 }}
      />
      <div
        className="absolute -bottom-24 -left-12 h-1/2 w-2/5 rounded-full blur-3xl transition-none"
        style={{ background: color2, opacity: 0.08 }}
      />
    </div>
  );
}
