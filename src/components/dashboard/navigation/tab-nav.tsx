"use client";

import Calendar01Icon from "@hugeicons/core-free-icons/Calendar01Icon";
import ChartUpIcon from "@hugeicons/core-free-icons/ChartUpIcon";
import GridIcon from "@hugeicons/core-free-icons/GridIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { startTransition } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { springPresets } from "@/lib/utils/spring-presets";
import type { TabValue } from "../types";

interface TabConfig {
  value: TabValue;
  label: string;
  icon: typeof Calendar01Icon;
}

const tabs: TabConfig[] = [
  { value: "today", label: "Today", icon: Calendar01Icon },
  { value: "practice", label: "Practice", icon: GridIcon },
  { value: "analytics", label: "Analytics", icon: ChartUpIcon },
];

interface TabNavProps {
  activeTab: TabValue;
  onTabChange: (tab: TabValue) => void;
  "aria-label"?: string;
}

export function TabNav({
  activeTab,
  onTabChange,
  "aria-label": ariaLabel = "Main navigation",
}: TabNavProps) {
  const prefersReducedMotion = useReducedMotion();
  const activeIndex = Math.max(
    0,
    tabs.findIndex((t) => t.value === activeTab),
  );
  const tabCount = tabs.length || 1;
  const segment = 100 / tabCount;
  const indicatorStyle = {
    left: `calc(${activeIndex * segment}% + 2px)`,
    right: `calc(${(tabCount - 1 - activeIndex) * segment}% + 2px)`,
  };

  const handleTabChange = (value: string) => {
    startTransition(() => {
      onTabChange(value as TabValue);
    });
  };

  return (
    <m.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <Tabs value={activeTab} onValueChange={handleTabChange} aria-label={ariaLabel}>
        <TabsList
          className="relative mx-auto grid h-12 w-full max-w-sm grid-cols-3 rounded-2xl border border-border/30 bg-system-background/80 p-1 shadow-level-1 backdrop-blur-xl"
          role="tablist"
        >
          <m.span
            layoutId="tab-indicator"
            transition={prefersReducedMotion ? undefined : springPresets.cardExit}
            className={cn(
              "absolute top-0.5 bottom-0.5 rounded-xl border border-border/20 bg-background shadow-level-1",
            )}
            style={indicatorStyle}
          />
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={cn(
                "relative z-elevated flex items-center justify-center gap-1.5 rounded-xl text-xs transition-[color,transform] duration-200 press-scale",
                activeTab === tab.value
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
              role="tab"
              aria-selected={activeTab === tab.value}
              tabIndex={activeTab === tab.value ? 0 : -1}
            >
              <HugeiconsIcon
                icon={tab.icon}
                className={cn(
                  "size-4 transition-colors duration-300",
                  activeTab === tab.value && "text-primary",
                )}
              />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </m.div>
  );
}
