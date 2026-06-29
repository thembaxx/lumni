"use client";

import { useEffect, useState } from "react";

export interface DiagramColors {
  textPrimary: string;
  textSecondary: string;
  textOnFill: string;
  accent: string;
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
  chart6: string;
  line: string;
  lineStrong: string;
  lineSubtle: string;
  grid: string;
  atomColors: Record<string, string>;
}

const LIGHT: DiagramColors = {
  textPrimary: "oklch(20% 0.02 264)",
  textSecondary: "oklch(20% 0.02 264 / 0.65)",
  textOnFill: "oklch(100% 0 0)",
  accent: "oklch(52% 0.18 146)",
  chart1: "oklch(55.6% 0.219 264)",
  chart2: "oklch(60.7% 0.196 28)",
  chart3: "oklch(59.6% 0.171 164)",
  chart4: "oklch(55.4% 0.172 333)",
  chart5: "oklch(56.1% 0.155 50)",
  chart6: "oklch(52.6% 0.142 302)",
  line: "oklch(70% 0 0)",
  lineStrong: "oklch(40% 0 0)",
  lineSubtle: "oklch(32.5% 0.012 264°)",
  grid: "oklch(92% 0 0)",
  atomColors: {
    C: "oklch(55% 0 0)",
    H: "oklch(100% 0 0)",
    O: "oklch(65% 0.2 30)",
    N: "oklch(55% 0.2 240)",
    S: "oklch(60% 0.2 100)",
    P: "oklch(60% 0.2 280)",
    F: "oklch(50% 0.15 140)",
    Cl: "oklch(50% 0.15 140)",
    Br: "oklch(45% 0.15 30)",
    I: "oklch(40% 0.15 280)",
    Na: "oklch(60% 0.15 50)",
    Fe: "oklch(50% 0.15 30)",
    Cu: "oklch(55% 0.15 40)",
    Zn: "oklch(55% 0.1 200)",
    Mg: "oklch(55% 0.1 140)",
    Ca: "oklch(60% 0.1 80)",
    He: "oklch(60% 0.1 240)",
    Ne: "oklch(60% 0.1 240)",
    Ar: "oklch(60% 0.1 240)",
  },
};

const DARK: DiagramColors = {
  textPrimary: "oklch(98% 0.01 264)",
  textSecondary: "oklch(98% 0.01 264 / 0.65)",
  textOnFill: "oklch(100% 0 0)",
  accent: "oklch(65% 0.18 146)",
  chart1: "oklch(70% 0.2 264)",
  chart2: "oklch(72% 0.19 28)",
  chart3: "oklch(72% 0.18 164)",
  chart4: "oklch(68% 0.18 333)",
  chart5: "oklch(70% 0.16 50)",
  chart6: "oklch(65% 0.15 302)",
  line: "oklch(35% 0 0)",
  lineStrong: "oklch(75% 0 0)",
  lineSubtle: "oklch(55% 0.02 264)",
  grid: "oklch(18% 0 0)",
  atomColors: LIGHT.atomColors,
};

export function useDiagramTheme(): DiagramColors {
  const [palette, setPalette] = useState<DiagramColors>(LIGHT);

  useEffect(() => {
    const update = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setPalette(isDark ? DARK : LIGHT);
    };

    update();

    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return palette;
}

export function getAtomColor(palette: DiagramColors, element: string): string {
  return palette.atomColors[element] || "oklch(55% 0.1 0)";
}

/** Extracts the L% value from an oklch(L% C H / alpha) string. Returns 0-100. */
function parseOklchLightness(color: string): number {
  const match = color.match(/oklch\((\d+(?:\.\d+)?)%/);
  return match ? Number.parseFloat(match[1]) : 50;
}

export function getAtomTextColor(palette: DiagramColors, element: string): string {
  const atomColor = getAtomColor(palette, element);
  const lightness = parseOklchLightness(atomColor);
  return lightness > 65 ? palette.textPrimary : palette.textOnFill;
}
