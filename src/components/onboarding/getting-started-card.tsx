"use client";

import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon";
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon";
import CheckmarkCircle01Icon from "@hugeicons/core-free-icons/CheckmarkCircle01Icon";
import PlayFreeIcons from "@hugeicons/core-free-icons/PlayIcon";
import Settings01Icon from "@hugeicons/core-free-icons/Settings01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { useCallback, useEffect, useRef, useState } from "react";
import { FIRST_VISITS_KEY } from "@/components/onboarding/onboarding-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRouter } from "@/i18n/navigation";
import { iOSEase } from "@/lib/utils/animation";

const STEPS_KEY = "lumni_getting_started_steps";

interface StepState {
  quiz: boolean;
  settings: boolean;
  explore: boolean;
}

const defaultSteps: StepState = {
  quiz: false,
  settings: false,
  explore: false,
};

const GETTING_STARTED_ACTIONS = [
  {
    key: "quiz" as const,
    icon: PlayFreeIcons,
    label: "Take your first quiz",
    desc: "Practice with AI-generated questions tailored to your subjects.",
    action: "Start quiz",
    href: "/quiz",
  },
  {
    key: "settings" as const,
    icon: Settings01Icon,
    label: "Set study preferences",
    desc: "Adjust your subjects, study time, and notification settings.",
    action: "Open settings",
    href: "/settings",
  },
  {
    key: "explore" as const,
    icon: ArrowRight01Icon,
    label: "Explore past papers",
    desc: "Practice with real Matric exam papers from previous years.",
    action: "Browse papers",
    href: "/past-papers",
  },
];

function loadSteps(): StepState {
  if (typeof window === "undefined") return defaultSteps;
  try {
    const raw = localStorage.getItem(STEPS_KEY);
    return raw ? { ...defaultSteps, ...JSON.parse(raw) } : defaultSteps;
  } catch {
    return defaultSteps;
  }
}

function saveSteps(steps: StepState) {
  localStorage.setItem(STEPS_KEY, JSON.stringify(steps));
}

export function GettingStartedCard() {
  const { push } = useRouter();
  const [dismissed, setDismissed] = useState(false);
  const [collapsing, setCollapsing] = useState(false);
  const [steps, setSteps] = useState<StepState>(() => loadSteps());
  const [visitsLeft] = useState(() => {
    if (typeof window === "undefined") return 3;
    const raw = localStorage.getItem(FIRST_VISITS_KEY);
    if (raw) {
      const n = Number.parseInt(raw, 10);
      return Number.isNaN(n) ? 0 : n;
    }
    return 3;
  });
  const visitsLeftRef = useRef(visitsLeft);
  const shouldReduceMotion = useReducedMotion();
  const timeoutRef = useRef<NodeJS.Timeout>(null);

  useEffect(() => {
    const ref = timeoutRef;
    return () => {
      if (ref.current) clearTimeout(ref.current);
    };
  }, []);

  const allDone = steps.quiz && steps.settings && steps.explore;

  const handleDismiss = useCallback(() => {
    setCollapsing(true);
    timeoutRef.current = setTimeout(() => {
      setDismissed(true);
      localStorage.setItem(FIRST_VISITS_KEY, String(Math.max(0, visitsLeftRef.current - 1)));
    }, 250);
  }, []);

  const markDone = useCallback(
    (key: keyof StepState, href?: string) => {
      const next = { ...steps, [key]: true };
      setSteps(next);
      saveSteps(next);
      if (href) push(href);
    },
    [steps, push],
  );

  if (dismissed || allDone || visitsLeft <= 0) return null;

  const actions = GETTING_STARTED_ACTIONS;

  return (
    <AnimatePresence initial={false}>
      {!collapsing && (
        <m.div
          key="card"
          initial={shouldReduceMotion ? {} : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={shouldReduceMotion ? {} : { opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: 0.4, ease: iOSEase }}
        >
          <Card className="overflow-hidden border border-system-accent/20 bg-system-accent/3">
            <div className="p-5">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h2 className="text-balance font-semibold text-lg tracking-tight">
                    Getting started
                  </h2>
                  <p className="mt-0.5 text-muted-foreground text-sm">
                    Complete these steps to make the most of Lumni.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="-mr-1 rounded-md p-3 transition-[scale,background-color] hover:bg-muted/50 press-scale"
                  aria-label="Dismiss"
                >
                  <HugeiconsIcon icon={Cancel01Icon} className="size-4 text-muted-foreground" />
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {actions.map((item) => {
                  const done = steps[item.key];
                  return (
                    <div
                      key={item.key}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (done) return;
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          markDone(item.key, item.href);
                        }
                      }}
                      className={`flex items-center gap-3 rounded-xl p-3 transition-colors ${
                        done ? "opacity-50" : "cursor-pointer hover:bg-muted/20 press-scale"
                      } transition-[scale] duration-150`}
                      onClick={done ? undefined : () => markDone(item.key, item.href)}
                    >
                      <div
                        className={`flex size-8 items-center justify-center rounded-full ${
                          done
                            ? "bg-success/20 text-success"
                            : "bg-system-accent/10 text-system-accent"
                        }`}
                      >
                        <div className="relative size-4">
                          <AnimatePresence mode="wait" initial={false}>
                            {done ? (
                              <m.div
                                key="check"
                                initial={{
                                  scale: 0.25,
                                  opacity: 0,
                                  filter: "blur(4px)",
                                }}
                                animate={{
                                  scale: 1,
                                  opacity: 1,
                                  filter: "blur(0px)",
                                }}
                                exit={{
                                  scale: 0.25,
                                  opacity: 0,
                                  filter: "blur(4px)",
                                }}
                                transition={{
                                  type: "spring",
                                  duration: 0.4,
                                  bounce: 0,
                                }}
                                className="absolute inset-0"
                              >
                                <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-4" />
                              </m.div>
                            ) : (
                              <m.div
                                key="action"
                                initial={{
                                  scale: 0.25,
                                  opacity: 0,
                                  filter: "blur(4px)",
                                }}
                                animate={{
                                  scale: 1,
                                  opacity: 1,
                                  filter: "blur(0px)",
                                }}
                                exit={{
                                  scale: 0.25,
                                  opacity: 0,
                                  filter: "blur(4px)",
                                }}
                                transition={{
                                  type: "spring",
                                  duration: 0.4,
                                  bounce: 0,
                                }}
                                className="absolute inset-0"
                              >
                                <HugeiconsIcon icon={item.icon} className="size-4" />
                              </m.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`font-semibold text-sm ${done ? "line-through" : ""}`}>
                          {item.label}
                        </p>
                        <p className="truncate text-pretty text-muted-foreground text-xs">
                          {item.desc}
                        </p>
                      </div>
                      {!done && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 shrink-0 px-3 text-xs"
                          onClick={() => markDone(item.key, item.href)}
                        >
                          {item.action}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </m.div>
      )}
    </AnimatePresence>
  );
}
