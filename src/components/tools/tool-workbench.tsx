"use client";

import { useState, useEffect, useCallback, useRef, memo } from "react";
import * as m from "motion/react-m";
import { AnimatePresence } from "motion/react";
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
import FlashIcon from "@hugeicons/core-free-icons/FlashIcon";
import Note01Icon from "@hugeicons/core-free-icons/Note01Icon";
import Search01Icon from "@hugeicons/core-free-icons/Search01Icon";
import Share07Icon from "@hugeicons/core-free-icons/Share07Icon";
import Target01Icon from "@hugeicons/core-free-icons/Target01Icon";
import Upload01Icon from "@hugeicons/core-free-icons/Upload01Icon";
import { AmbientGradient } from "@/components/shared/ambient-gradient";
import { NoiseOverlay } from "@/components/shared/noise-overlay";
import { PageContainer } from "@/components/layout/page-container";
import { ToolCard } from "./tool-card";
import { ParticleField } from "./particle-field";

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
  accent: string;
  icon: IconSvgElement;
  items: ToolDef[];
}

const Flash = FlashIcon as unknown as IconSvgElement;

const ComputeIcon = CalculatorIcon;
const CreateIcon = BookOpen02Icon;
const ResearchIcon = Search01Icon;
const UtilIcon = CompassIcon;

const ZONES: ZoneDef[] = [
  {
    id: "compute",
    label: "Compute",
    description: "Calculate, analyse, optimise",
    accent: "from-cyan-500/15 via-blue-500/5 to-transparent",
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
    accent: "from-violet-500/15 via-pink-500/5 to-transparent",
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
    accent: "from-amber-500/15 via-orange-500/5 to-transparent",
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
    accent: "from-emerald-500/15 via-teal-500/5 to-transparent",
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

const KONAMI_SEQUENCE = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
const LUMNI_SEQUENCE = ["l", "u", "m", "n", "i"];

type Sparkle = { id: number; x: number; y: number };

const SparkleDot = memo(function SparkleDot({ sparkle }: { sparkle: Sparkle }) {
  return (
    <m.div
      key={sparkle.id}
      initial={{ opacity: 1, scale: 1, y: 0 }}
      animate={{ opacity: 0, scale: 0, y: -30 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="pointer-events-none fixed z-50 size-1.5 rounded-full"
      style={{
        left: sparkle.x,
        top: sparkle.y,
        backgroundColor: "#fbbf24",
        boxShadow: "0 0 6px 2px rgba(251,191,36,0.6)",
      }}
    />
  );
});

function DiscoOverlay() {
  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="pointer-events-none fixed inset-0 z-40"
      style={{
        background:
          "repeating-linear-gradient(90deg, rgba(239,68,68,0.08) 0%, rgba(251,191,36,0.08) 20%, rgba(34,197,94,0.08) 40%, rgba(59,130,246,0.08) 60%, rgba(168,85,247,0.08) 80%, rgba(239,68,68,0.08) 100%)",
        backgroundSize: "200% 100%",
        animation: "disco-sweep 2s linear infinite",
      }}
    >
      <style>{`@keyframes disco-sweep { 0% { background-position: 0% 0%; } 100% { background-position: 200% 0%; } }`}</style>
    </m.div>
  );
}

function DebugConsole({ onDismiss }: { onDismiss: () => void }) {
  const [text, setText] = useState("");
  const full =
    "[LUMNI::DEBUG] Toolkit console activated.\n[LUMNI::DEBUG] 14 tools loaded, 0 errors.\n[LUMNI::DEBUG] Easter egg subsystem: ONLINE.";

  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      i++;
      setText(full.slice(0, i));
      if (i >= full.length) clearInterval(t);
    }, 25);
    return () => clearInterval(t);
  }, []);

  return (
    <m.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="fixed inset-4 z-50 flex items-center justify-center"
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-emerald-500/30 bg-black/90 p-6 shadow-2xl backdrop-blur-xl">
        <pre className="font-mono text-sm leading-relaxed text-emerald-400">
          {text}
          <m.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.6, repeat: Infinity }}>
            _
          </m.span>
        </pre>
        <button
          onClick={onDismiss}
          className="mt-4 rounded-lg bg-emerald-500/20 px-4 py-2 font-mono text-xs text-emerald-400 transition-colors hover:bg-emerald-500/30"
        >
          [OK]
        </button>
      </div>
    </m.div>
  );
}

function QuantumBurst({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
      {Array.from({ length: 12 }).map((_, i) => (
        <m.div
          key={i}
          initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
            x: Math.cos((i / 12) * Math.PI * 2) * 120,
            y: Math.sin((i / 12) * Math.PI * 2) * 120,
          }}
          transition={{ duration: 0.8, delay: i * 0.03, ease: "easeOut" }}
          className="absolute size-2 rounded-full"
          style={{
            backgroundColor: "var(--system-accent)",
            boxShadow: "0 0 12px 4px var(--system-accent)",
          }}
        />
      ))}
      <m.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0] }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="absolute text-3xl font-bold"
        style={{ color: "var(--system-accent)" }}
      >
        ✦
      </m.div>
    </div>
  );
}

export function ToolWorkbench() {
  const [headerClicks, setHeaderClicks] = useState(0);
  const [voidClicks, setVoidClicks] = useState(0);
  const [showQuantum, setShowQuantum] = useState(false);
  const [showVoid, setShowVoid] = useState(false);
  const [showConsole, setShowConsole] = useState(false);
  const [showDisco, setShowDisco] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);
  const [spinningCard, setSpinningCard] = useState<string | null>(null);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [burst, setBurst] = useState(false);

  const konamiIdx = useRef(0);
  const lumniIdx = useRef(0);
  const fortyTwoBuf = useRef<string[]>([]);
  const sparkleId = useRef(0);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      fortyTwoBuf.current.push(key);
      if (fortyTwoBuf.current.length > 2) fortyTwoBuf.current.shift();
      if (fortyTwoBuf.current.join("") === "42" && !showQuantum) {
        setShowQuantum(true);
        setBurst(true);
        fortyTwoBuf.current = [];
      }

      if (key === LUMNI_SEQUENCE[lumniIdx.current]) {
        lumniIdx.current++;
        if (lumniIdx.current === LUMNI_SEQUENCE.length) {
          setShowSparkles(true);
          lumniIdx.current = 0;
          setTimeout(() => setShowSparkles(false), 5000);
        }
      } else {
        lumniIdx.current = key === LUMNI_SEQUENCE[0] ? 1 : 0;
      }

      if (e.keyCode === KONAMI_SEQUENCE[konamiIdx.current]) {
        konamiIdx.current++;
        if (konamiIdx.current === KONAMI_SEQUENCE.length) {
          setShowDisco(true);
          konamiIdx.current = 0;
          setTimeout(() => setShowDisco(false), 3000);
        }
      } else {
        konamiIdx.current = 0;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showQuantum, showDisco]);

  useEffect(() => {
    if (!showSparkles) return;
    const handler = (e: MouseEvent) => {
      sparkleId.current++;
      setSparkles((prev) => [
        ...prev.slice(-30),
        { id: sparkleId.current, x: e.clientX, y: e.clientY },
      ]);
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, [showSparkles]);

  useEffect(() => {
    if (!showSparkles) setSparkles([]);
  }, [showSparkles]);

  const onHeaderClick = useCallback(() => {
    const next = headerClicks + 1;
    setHeaderClicks(next);
    if (next >= 5) {
      setShowConsole(true);
      setHeaderClicks(0);
    }
  }, [headerClicks]);

  const onVoidClick = useCallback(() => {
    if (showVoid) return;
    const next = voidClicks + 1;
    setVoidClicks(next);
    if (next >= 10) setShowVoid(true);
  }, [voidClicks, showVoid]);

  const onShiftClick = useCallback((label: string) => {
    setSpinningCard(label);
    setTimeout(() => setSpinningCard(null), 2000);
  }, []);

  const secretTools: ToolDef[] = [];
  if (showQuantum) {
    secretTools.push({
      label: "Quantum Calculator",
      description: "A hidden dimension of calculation",
      href: "/tools/calculator",
      icon: Flash,
    });
  }
  if (showVoid) {
    secretTools.push({
      label: "???",
      description: "You found the void. What lies beyond?",
      href: "/solve",
      icon: Target01Icon,
    });
  }

  return (
    <>
      <ParticleField />
      <AnimatePresence>{showDisco && <DiscoOverlay />}</AnimatePresence>
      <AnimatePresence>
        {showConsole && <DebugConsole onDismiss={() => setShowConsole(false)} />}
      </AnimatePresence>
      <AnimatePresence>{burst && <QuantumBurst onDone={() => setBurst(false)} />}</AnimatePresence>
      <AnimatePresence>
        {sparkles.map((s) => (
          <SparkleDot key={s.id} sparkle={s} />
        ))}
      </AnimatePresence>
      {spinningCard && (
        <style>{`
          @keyframes card-spin-${spinningCard.replace(/\s+/g, "")} {
            from { transform: rotate(0deg); }
            to { transform: rotate(720deg); }
          }
        `}</style>
      )}

      <div
        role="none"
        className="relative min-h-dvh bg-system-grouped"
        onClick={(e) => {
          if (e.target === e.currentTarget || (e.target as HTMLElement).dataset?.void)
            onVoidClick();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onVoidClick();
        }}
      >
        <AmbientGradient variant="default" />
        <NoiseOverlay opacity={0.015} />
        <PageContainer className="pt-6 pb-24">
          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, mass: 1 }}
            className="mb-10"
          >
            <button
              onClick={onHeaderClick}
              className="text-left"
              aria-label={`Toolbox header${headerClicks > 0 ? ` (${5 - headerClicks} clicks to unlock)` : ""}`}
            >
              <h1 className="ios-title-1 font-extrabold text-foreground tracking-tight">Toolbox</h1>
              <p className="mt-1 text-muted-foreground text-sm">
                Everything you need to study smarter
              </p>
            </button>
          </m.div>

          {ZONES.map((zone, zi) => (
            <m.section
              key={zone.id}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5 }}
              className="mb-10 last:mb-0"
            >
              <div className="mb-4 flex items-center gap-3">
                <div
                  className={`flex size-9 items-center justify-center rounded-xl bg-gradient-to-br ${zone.accent} border border-border/40`}
                >
                  <HugeiconsIcon icon={zone.icon} className="size-4.5 text-foreground/70" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground text-base">{zone.label}</h2>
                  <p className="text-muted-foreground text-xs">{zone.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {zone.items.map((item, ii) => (
                  <ToolCard
                    key={item.href}
                    label={item.label}
                    description={item.description}
                    href={item.href}
                    icon={item.icon}
                    index={ii}
                    zoneIndex={zi}
                    totalItems={zone.items.length}
                    onShiftClick={() => onShiftClick(item.label)}
                  />
                ))}
              </div>
            </m.section>
          ))}

          {secretTools.length > 0 && (
            <m.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="mt-10"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-system-accent/20 via-purple-500/10 to-transparent border border-system-accent/30">
                  <HugeiconsIcon
                    icon={Target01Icon}
                    className="size-4.5 text-system-accent/70"
                    data-void
                  />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground text-base">Discovered</h2>
                  <p className="text-muted-foreground text-xs">Secret tools unlocked</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {secretTools.map((item, ii) => (
                  <ToolCard
                    key={item.label}
                    label={item.label}
                    description={item.description}
                    href={item.href}
                    icon={item.icon}
                    index={ii}
                    zoneIndex={99}
                    totalItems={secretTools.length}
                    secret
                    onShiftClick={() => onShiftClick(item.label)}
                  />
                ))}
              </div>
            </m.section>
          )}

          {voidClicks > 0 && voidClicks < 10 && (
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 flex justify-center"
            >
              <p
                className="text-[10px] text-muted-foreground/30 tracking-widest uppercase select-none"
                data-void
              >
                {"·".repeat(voidClicks)}
              </p>
            </m.div>
          )}
        </PageContainer>
      </div>
    </>
  );
}
