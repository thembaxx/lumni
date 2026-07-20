"use client";

import { useState, useCallback, memo } from "react";
import * as m from "motion/react-m";
import { HugeiconsIcon } from "@hugeicons/react";
import type { IconSvgElement } from "@hugeicons/react";
import Atom01Icon from "@hugeicons/core-free-icons/Atom01Icon";
import Award01Icon from "@hugeicons/core-free-icons/Award01Icon";
import BookOpen01Icon from "@hugeicons/core-free-icons/BookOpen01Icon";
import BookOpen02Icon from "@hugeicons/core-free-icons/BookOpen02Icon";
import CalculateIcon from "@hugeicons/core-free-icons/CalculateIcon";
import CalculatorIcon from "@hugeicons/core-free-icons/CalculatorIcon";
import Calendar01Icon from "@hugeicons/core-free-icons/Calendar01Icon";
import Chat01Icon from "@hugeicons/core-free-icons/Chat01Icon";
import CompassIcon from "@hugeicons/core-free-icons/CompassIcon";
import Note01Icon from "@hugeicons/core-free-icons/Note01Icon";
import Search01Icon from "@hugeicons/core-free-icons/Search01Icon";
import Share07Icon from "@hugeicons/core-free-icons/Share07Icon";
import Target01Icon from "@hugeicons/core-free-icons/Target01Icon";
import Upload01Icon from "@hugeicons/core-free-icons/Upload01Icon";
import { AmbientGradient } from "@/components/shared/ambient-gradient";
import { NoiseOverlay } from "@/components/shared/noise-overlay";
import { PageContainer } from "@/components/layout/page-container";
import { ToolCard } from "./tool-card";
import { springPresets } from "@/lib/utils/spring-presets";

interface ToolDef {
  label: string;
  description: string;
  href: string;
  icon: IconSvgElement;
}

interface ZoneDef {
  id: string;
  label: string;
  description: string;
  icon: IconSvgElement;
  items: ToolDef[];
}

const ComputeIcon = CalculatorIcon;
const CreateIcon = BookOpen02Icon;
const ResearchIcon = Search01Icon;
const UtilIcon = CompassIcon;

const ZONES: ZoneDef[] = [
  {
    id: "compute",
    label: "Compute",
    description: "Calculate, analyse, optimise",
    icon: ComputeIcon,
    items: [
      {
        label: "Calculator",
        description: "Scientific calculator",
        href: "/tools/calculator",
        icon: CalculatorIcon,
      },
      {
        label: "APS Calculator",
        description: "Calculate your APS score",
        href: "/tools/aps",
        icon: CalculateIcon,
      },
      {
        label: "Results",
        description: "Search past exam results",
        href: "/tools/results",
        icon: Award01Icon,
      },
      {
        label: "Scheduler",
        description: "Plan your study schedule",
        href: "/tools/scheduler",
        icon: Calendar01Icon,
      },
    ],
  },
  {
    id: "create",
    label: "Create",
    description: "Make, write, organise",
    icon: CreateIcon,
    items: [
      {
        label: "Notes",
        description: "Create and manage study notes",
        href: "/tools/notes",
        icon: Note01Icon,
      },
      {
        label: "Study Sets",
        description: "Create flashcard study sets",
        href: "/tools/study-sets",
        icon: BookOpen02Icon,
      },
      {
        label: "Study Guide",
        description: "Generate AI study guides",
        href: "/study-guide",
        icon: BookOpen01Icon,
      },
    ],
  },
  {
    id: "research",
    label: "Research",
    description: "Discover, learn, explore",
    icon: ResearchIcon,
    items: [
      {
        label: "Periodic Table",
        description: "Interactive periodic table",
        href: "/tools/periodic",
        icon: Atom01Icon,
      },
      {
        label: "Dictionary",
        description: "Look up word definitions",
        href: "/dictionary",
        icon: Search01Icon,
      },
      { label: "Chat", description: "AI tutor chat assistant", href: "/chat", icon: Chat01Icon },
    ],
  },
  {
    id: "utilities",
    label: "Utilities",
    description: "Solve, share, upload",
    icon: UtilIcon,
    items: [
      {
        label: "Solve",
        description: "Step-by-step problem solver",
        href: "/solve",
        icon: CompassIcon,
      },
      {
        label: "Upload",
        description: "Upload files and documents",
        href: "/upload",
        icon: Upload01Icon,
      },
      {
        label: "Referral",
        description: "Invite friends and earn rewards",
        href: "/settings/referral",
        icon: Share07Icon,
      },
    ],
  },
];

const SPRING = springPresets.fast;

const VoidDot = memo(function VoidDot({ filled }: { filled: boolean }) {
  return (
    <span
      className={
        "inline-block size-1 rounded-full " + (filled ? "bg-foreground/40" : "bg-transparent")
      }
      aria-hidden="true"
    />
  );
});

export function ToolWorkbench() {
  const [voidClicks, setVoidClicks] = useState(0);
  const [showVoid, setShowVoid] = useState(false);

  const onVoidClick = useCallback(() => {
    if (showVoid) return;
    const next = voidClicks + 1;
    setVoidClicks(next);
    if (next >= 10) setShowVoid(true);
  }, [showVoid, voidClicks]);

  const onGridKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const arrows = ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "Home", "End"];
    if (!arrows.includes(e.key)) return;
    const grid = e.currentTarget;
    const cards = Array.from(grid.querySelectorAll<HTMLAnchorElement>("a[href]"));
    if (cards.length === 0) return;
    const current = document.activeElement as HTMLAnchorElement | null;
    const idx = current ? cards.indexOf(current) : -1;
    if (idx === -1) return;
    const cols = getComputedStyle(grid).gridTemplateColumns.split(" ").filter(Boolean).length || 1;
    let next = idx;
    switch (e.key) {
      case "ArrowRight":
        next = Math.min(idx + 1, cards.length - 1);
        break;
      case "ArrowLeft":
        next = Math.max(idx - 1, 0);
        break;
      case "ArrowDown":
        next = Math.min(idx + cols, cards.length - 1);
        break;
      case "ArrowUp":
        next = Math.max(idx - cols, 0);
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = cards.length - 1;
        break;
    }
    if (next !== idx) {
      e.preventDefault();
      cards[next]?.focus();
    }
  }, []);

  const secretTools: ToolDef[] = [];
  if (showVoid) {
    secretTools.push({
      label: "???",
      description: "You found the void. What lies beyond?",
      href: "/solve",
      icon: Target01Icon,
    });
  }

  return (
    <div
      role="none"
      className="relative min-h-dvh bg-system-grouped"
      onClick={(e) => {
        if (e.target === e.currentTarget || (e.target as HTMLElement).dataset?.void) onVoidClick();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onVoidClick();
      }}
    >
      <AmbientGradient variant="default" />
      <NoiseOverlay opacity={0.015} />
      <PageContainer className="pt-6 pb-24">
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SPRING}
          className="mb-10"
        >
          <h1 className="ios-title-1 font-bold text-foreground tracking-tight">Toolbox</h1>
          <p className="mt-1 text-muted-foreground text-sm">Everything you need to study smarter</p>
        </m.div>

        {ZONES.map((zone, zi) => (
          <m.section
            key={zone.id}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ ...SPRING, delay: zi * 0.05 }}
            className="mb-10 last:mb-0"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-secondary border border-border/60">
                <HugeiconsIcon icon={zone.icon} className="size-4.5 text-foreground/70" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground text-base">{zone.label}</h2>
                <p className="text-muted-foreground text-xs">{zone.description}</p>
              </div>
            </div>
            <div
              role="grid"
              tabIndex={-1}
              aria-label={`${zone.label} tools`}
              className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
              onKeyDown={onGridKeyDown}
            >
              {zone.items.map((item, ii) => (
                <div role="row" key={item.href} className="contents">
                  <ToolCard
                    label={item.label}
                    description={item.description}
                    href={item.href}
                    icon={item.icon}
                    index={zi * 3 + ii}
                  />
                </div>
              ))}
            </div>
          </m.section>
        ))}

        <span className="sr-only" role="status" aria-live="polite">
          {showVoid ? "Secret tools unlocked" : ""}
        </span>

        {secretTools.length > 0 && (
          <m.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={SPRING}
            className="mt-10"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-secondary border border-border/60">
                <HugeiconsIcon
                  icon={Target01Icon}
                  className="size-4.5 text-foreground/70"
                  data-void
                />
              </div>
              <div>
                <h2 className="font-semibold text-foreground text-base">Discovered</h2>
                <p className="text-muted-foreground text-xs">Secret tools unlocked</p>
              </div>
            </div>
            <div
              role="grid"
              tabIndex={-1}
              aria-label="Discovered tools"
              className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
              onKeyDown={onGridKeyDown}
            >
              {secretTools.map((item, ii) => (
                <div role="row" key={item.label} className="contents">
                  <ToolCard
                    label={item.label}
                    description={item.description}
                    href={item.href}
                    icon={item.icon}
                    index={ii}
                    secret
                  />
                </div>
              ))}
            </div>
          </m.section>
        )}

        {voidClicks > 0 && voidClicks < 10 && (
          <m.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 flex justify-center"
          >
            <p
              className="flex items-center gap-1 text-[10px] text-muted-foreground/30 tracking-widest uppercase select-none"
              data-void
              aria-hidden="true"
            >
              {Array.from({ length: 10 }).map((_, i) => (
                <VoidDot key={i} filled={i < voidClicks} />
              ))}
            </p>
          </m.div>
        )}
      </PageContainer>
    </div>
  );
}
