"use client";

import ComputerIcon from "@hugeicons/core-free-icons/ComputerIcon";
import MoonIcon from "@hugeicons/core-free-icons/MoonIcon";
import Sun01Icon from "@hugeicons/core-free-icons/Sun01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { useTheme } from "@/components/theme";
import { useMoonEasterEgg } from "@/lib/shared/easter-egg-context";
import { Button } from "@/components/ui/button";

type Theme = "system" | "dark" | "light";

const themes: Theme[] = ["system", "light", "dark"];

const iconMap = {
  system: ComputerIcon,
  light: Sun01Icon,
  dark: MoonIcon,
} as const;

const labels = {
  system: "System",
  light: "Light",
  dark: "Dark",
} as const;

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const handleMoonClick = useMoonEasterEgg();

  const nextTheme = () => {
    const currentIndex = themes.indexOf(theme);
    return themes[(currentIndex + 1) % themes.length];
  };

  const CurrentIcon = iconMap[theme];

  return (
    <div className="flex items-center justify-between gap-3">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          setTheme(nextTheme());
          if (theme === "dark") handleMoonClick();
        }}
        className="border border-border"
        aria-label={`Current theme: ${labels[theme]}. Click to switch to ${labels[nextTheme()]}`}
      >
        <div className="relative size-4">
          <AnimatePresence mode="popLayout" initial={false}>
            <m.div
              key={theme}
              initial={{ opacity: 0, scale: 0.5, filter: "blur(4px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.5, filter: "blur(4px)" }}
              transition={{
                duration: prefersReducedMotion ? 0 : 0.15,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <HugeiconsIcon icon={CurrentIcon} className="size-4 text-foreground" />
            </m.div>
          </AnimatePresence>
        </div>
      </Button>
    </div>
  );
}
