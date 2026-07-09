"use client";

import * as m from "motion/react-m";
import { elementEaseOutQuart } from "@/lib/data/element-categories";

interface ShellData {
  level: number;
  count: number;
  subshells: string;
}

const SUPERSCRIPTS: Record<string, string> = {
  "0": "\u2070",
  "1": "\u00B9",
  "2": "\u00B2",
  "3": "\u00B3",
  "4": "\u2074",
  "5": "\u2075",
  "6": "\u2076",
  "7": "\u2077",
  "8": "\u2078",
  "9": "\u2079",
};

function toSuperscript(num: number): string {
  return String(num)
    .split("")
    .map((c) => SUPERSCRIPTS[c] || c)
    .join("");
}

function parseElectronConfig(config: string): ShellData[] {
  const shells = new Map<number, { count: number; parts: string[] }>();

  const stripped = config.replace(/\[.*?\]\s*/g, "");
  const tokens = stripped.split(/\s+/).filter(Boolean);

  for (const token of tokens) {
    const match = token.match(/^(\d)([spdf])(\d*)$/);
    if (!match) continue;
    const shell = Number.parseInt(match[1], 10);
    const subshell = match[2];
    const count = match[3] ? Number.parseInt(match[3], 10) : 1;

    const existing = shells.get(shell) ?? { count: 0, parts: [] };
    existing.count += count;
    existing.parts.push(`${subshell}${toSuperscript(count)}`);
    shells.set(shell, existing);
  }

  return Array.from(shells.entries())
    .toSorted(([a], [b]) => a - b)
    .map(([level, { count, parts }]) => ({
      level,
      count,
      subshells: parts.join(" "),
    }));
}

const SHELL_LABELS = ["K", "L", "M", "N", "O", "P", "Q"];

const MAX_ELECTRONS = 32;

export function ElectronShellVisual({ electronConfig }: { electronConfig: string }) {
  const shells = parseElectronConfig(electronConfig);

  return (
    <div className="flex flex-col gap-2">
      {shells.map((shell, i) => {
        const pct = Math.min((shell.count / MAX_ELECTRONS) * 100, 100);
        return (
          <m.div
            key={shell.level}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: 0.3 + i * 0.06,
              duration: 0.4,
              ease: elementEaseOutQuart,
            }}
            className="flex items-center gap-3"
          >
            <span className="w-8 shrink-0 font-semibold text-muted-foreground text-xs">
              {SHELL_LABELS[shell.level - 1] ?? shell.level}
            </span>
            <div className="relative h-5 flex-1 overflow-hidden rounded-full bg-white/5 dark:bg-white/10">
              <m.div
                className="absolute inset-y-0 left-0 origin-left rounded-full bg-(--system-accent)/60"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: pct / 100 }}
                transition={{
                  delay: 0.4 + i * 0.06,
                  duration: 0.6,
                  ease: elementEaseOutQuart,
                }}
              />
              <span className="relative z-elevated flex h-full items-center px-2 font-medium text-white text-xs tabular-nums">
                {shell.count}e\u207B
              </span>
            </div>
            <span className="shrink-0 font-medium text-muted-foreground text-xs">
              {shell.subshells}
            </span>
          </m.div>
        );
      })}
    </div>
  );
}
