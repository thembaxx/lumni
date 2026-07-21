"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppwriteSession } from "@/hooks/use-appwrite-session";
import { useEasterEgg } from "@/lib/shared/easter-egg-context";
import { cn } from "@/lib/utils";
import {
  getDaysUntil,
  getMessage,
  getMilestone,
  getPhase,
  getTimeOfDay,
  getYearProgress,
  greetingMap,
  type Phase,
  phaseConfigs,
} from "@/lib/utils/countdown-helpers";
import { YearRingProgress } from "./parts/year-ring-progress";

type CountdownState = {
  mounted: boolean;
  daysLeft: number;
  yearProgress: number;
};

type CountdownAction = { type: "MOUNT" } | { type: "TICK" };

function countdownReducer(state: CountdownState, action: CountdownAction): CountdownState {
  switch (action.type) {
    case "MOUNT":
      return { mounted: true, daysLeft: getDaysUntil(), yearProgress: getYearProgress() };
    case "TICK":
      return { ...state, daysLeft: getDaysUntil(), yearProgress: getYearProgress() };
  }
}

export function HeroBanner() {
  const {
    user: { name },
    isLoggedIn,
    isLoading: _sessionLoading,
  } = useAppwriteSession();
  const [cdState, dispatchCd] = useReducer(countdownReducer, {
    mounted: false,
    daysLeft: 0,
    yearProgress: 0,
  });
  const { mounted, daysLeft, yearProgress } = cdState;
  const logoClickCount = useRef(0);
  const { trigger } = useEasterEgg();

  useEffect(() => {
    dispatchCd({ type: "MOUNT" });
    const midnight = new Date();
    midnight.setDate(midnight.getDate() + 1);
    midnight.setHours(0, 0, 0, 0);
    const msUntilMidnight = midnight.getTime() - Date.now();
    const timeout = setTimeout(() => dispatchCd({ type: "TICK" }), msUntilMidnight);
    const interval = setInterval(() => dispatchCd({ type: "TICK" }), 1000 * 60 * 60 * 24);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  const handleLogoClick = useCallback(() => {
    logoClickCount.current++;
    if (logoClickCount.current >= 7) {
      logoClickCount.current = 0;
      trigger("party");
    }
  }, [trigger]);

  const greeting = mounted ? greetingMap[getTimeOfDay()] : "Good";
  const firstName = isLoggedIn && name ? name.split(" ")[0] : null;
  const phase: Phase = mounted ? getPhase(daysLeft) : "grind";
  const msg = mounted ? getMessage(daysLeft, firstName) : { primary: "", subtitle: "" };
  const cfg = phaseConfigs[phase];
  const milestone = mounted ? getMilestone(daysLeft) : null;

  return (
    <div
      className="group relative overflow-hidden rounded-card-lg glass-bento-strong shadow-level-2 transition-[box-shadow] duration-500 hover:shadow-level-3"
      onClick={handleLogoClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleLogoClick();
      }}
      aria-label="Dashboard hero — click 7 times for a surprise"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-system-accent/6 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        aria-hidden="true"
      />
      <div
        className={cn(
          "pointer-events-none absolute -top-6 -right-6 size-48 rounded-full blur-3xl opacity-40 transition-[scale,opacity] duration-700 group-hover:scale-110 group-hover:opacity-60",
          cfg.glowClass,
        )}
        aria-hidden="true"
      />
      <div
        className={cn(
          "pointer-events-none absolute -bottom-4 -left-4 size-32 rounded-full blur-2xl opacity-30",
          cfg.glow2Class,
        )}
        aria-hidden="true"
      />

      <div className="relative flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6 sm:py-6">
        <div className="flex flex-col gap-3">
          {milestone && (
            <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-warning/30 bg-warning/15 px-3 py-1">
              <span className="animate-float-bob text-sm" style={{ animationDelay: "0.15s" }}>
                {milestone.emoji}
              </span>
              <span className="font-bold text-warning text-xs uppercase tracking-tight">
                {milestone.label}
              </span>
            </div>
          )}

          <h1 className="text-balance font-heading font-extrabold text-(--fs-heading-2) text-foreground leading-tight tracking-tight md:text-4xl">
            {greeting}
            {isLoggedIn && name ? <span className="text-system-accent">, {firstName}</span> : null}
          </h1>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {_sessionLoading || !mounted ? (
              <Skeleton className="h-10 w-28 rounded-lg" />
            ) : (
              <span
                className="card-entrance inline-flex items-baseline gap-1 font-bold font-mono text-5xl text-system-accent tabular-nums tracking-tighter md:text-6xl"
                aria-live="polite"
              >
                {daysLeft}
                <span className="font-medium text-(--fs-body) text-muted-foreground not-italic">
                  {daysLeft === 1 ? "day" : "days"} until finals
                </span>
              </span>
            )}
          </div>

          {mounted && (
            <p className="card-entrance text-pretty font-medium text-muted-foreground text-sm leading-snug">
              <span className="font-semibold text-foreground/80">{msg.primary}</span> {msg.subtitle}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <YearRingProgress progress={yearProgress} />
        </div>
      </div>
    </div>
  );
}
