"use client";

import { useEffect, useReducer } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppwriteSession } from "@/hooks/use-appwrite-session";
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

type CountdownState = {
  mounted: boolean;
  daysLeft: number;
  yearProgress: number;
};

type CountdownAction = { type: "MOUNT" } | { type: "TICK" };

function countdownReducer(state: CountdownState, action: CountdownAction): CountdownState {
  switch (action.type) {
    case "MOUNT":
      return {
        mounted: true,
        daysLeft: getDaysUntil(),
        yearProgress: getYearProgress(),
      };
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
  useEffect(() => {
    dispatchCd({ type: "MOUNT" });
    const midnight = new Date();
    midnight.setDate(midnight.getDate() + 1);
    midnight.setHours(0, 0, 0, 0);
    const msUntilMidnight = midnight.getTime() - Date.now();
    const timeout = setTimeout(() => {
      dispatchCd({ type: "TICK" });
    }, msUntilMidnight);
    const interval = setInterval(() => dispatchCd({ type: "TICK" }), 1000 * 60 * 60 * 24);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  const greeting = mounted ? greetingMap[getTimeOfDay()] : "Good";
  const firstName = isLoggedIn && name ? name.split(" ")[0] : null;
  const phase: Phase = mounted ? getPhase(daysLeft) : "grind";
  const msg = mounted ? getMessage(daysLeft, firstName) : { primary: "", subtitle: "" };
  const cfg = phaseConfigs[phase];
  const milestone = mounted ? getMilestone(daysLeft) : null;

  return (
    <div className="group relative overflow-hidden rounded-card-lg bg-linear-to-br from-(--system-surface-secondary) via-(--system-surface-secondary)/50 to-transparent shadow-level-2 transition-[box-shadow] duration-500 hover:shadow-level-3">
      <div
        className="absolute inset-0 bg-gradient-to-tr from-system-accent/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        aria-hidden="true"
      />
      <div className="relative px-5 py-5 sm:px-6 sm:py-6">
        {milestone && (
          <div className="absolute -top-px right-4 left-4 flex items-center justify-center">
            <div className="inline-flex items-center gap-1.5 rounded-b-xl border border-warning/30 bg-warning/20 px-3 py-1">
              <span className="animate-float-bob text-sm" style={{ animationDelay: "0.15s" }}>
                {milestone.emoji}
              </span>
              <span className="font-bold text-warning text-xs uppercase tracking-tight">
                {milestone.label}
              </span>
            </div>
          </div>
        )}

        <div className="relative z-elevated flex flex-col gap-3">
          <h1 className="text-balance font-heading font-extrabold text-(--fs-heading-2) text-foreground leading-tight tracking-tight">
            {greeting}
            {isLoggedIn && name ? <span className="text-system-accent">, {firstName}</span> : null}
          </h1>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {_sessionLoading || !mounted ? (
              <Skeleton className="h-8 w-24 rounded-md" />
            ) : (
              <span
                className="card-entrance inline-block font-bold font-mono text-4xl text-system-accent tabular-nums tracking-tighter md:text-5xl"
                aria-live="polite"
              >
                {daysLeft}
              </span>
            )}
            {!_sessionLoading && mounted && (
              <div>
                <p className="font-medium text-muted-foreground text-xs tabular-nums">
                  {daysLeft === 1 ? "day" : "days"}
                </p>
                <p className="font-bold text-muted-foreground text-xs tabular-nums">until finals</p>
              </div>
            )}
          </div>

          <progress
            className="h-1.5 w-full overflow-hidden rounded-full bg-border/40 [&::-moz-progress-bar]:bg-system-accent [&::-webkit-progress-bar]:bg-transparent [&::-webkit-progress-value]:bg-system-accent"
            value={mounted ? Math.round(yearProgress * 100) : 0}
            max={100}
            aria-label="Year progress: days studied vs total"
          />

          {mounted && (
            <p className="card-entrance text-pretty font-medium text-muted-foreground text-xs leading-snug">
              <span className="font-bold text-foreground/80">{msg.primary}</span>. {msg.subtitle}
            </p>
          )}
        </div>

        <div
          className={cn(
            "card-entrance pointer-events-none absolute -top-6 -right-6 size-32 rounded-full blur-2xl",
            cfg.glowClass,
          )}
          aria-hidden="true"
        />
        <div
          className={cn(
            "pointer-events-none absolute -right-4 -bottom-4 size-20 rounded-full blur-xl",
            cfg.glow2Class,
          )}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
