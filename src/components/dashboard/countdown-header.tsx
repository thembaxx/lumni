"use client";

import { useEffect, useReducer, useRef, useSyncExternalStore } from "react";
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
      return {
        ...state,
        daysLeft: getDaysUntil(),
        yearProgress: getYearProgress(),
      };
  }
}

export function CountdownHeader() {
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
  const sentinelRef = useRef<HTMLDivElement>(null);
  const isCompactRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const greeting = mounted ? greetingMap[getTimeOfDay()] : "Good";
  const firstName = isLoggedIn && name ? name.split(" ")[0] : null;
  const phase: Phase = mounted ? getPhase(daysLeft) : "grind";
  const msg = mounted ? getMessage(daysLeft, firstName) : { primary: "", subtitle: "" };
  const cfg = phaseConfigs[phase];
  const milestone = mounted ? getMilestone(daysLeft) : null;

  const isCompact = useSyncExternalStore(
    (onStoreChange) => {
      const el = sentinelRef.current;
      if (!el) return () => {};
      const container = el.closest("[data-scroll-container]") ?? null;
      const observer = new IntersectionObserver(
        ([entry]) => {
          isCompactRef.current = entry.boundingClientRect.top < 0;
          onStoreChange();
        },
        {
          root: container,
          rootMargin: "-1px 0px 0px 0px",
          threshold: 0,
        },
      );
      observer.observe(el);
      return () => observer.disconnect();
    },
    () => isCompactRef.current,
    () => false,
  );

  useEffect(() => {
    dispatchCd({ type: "MOUNT" });

    const midnight = new Date();
    midnight.setDate(midnight.getDate() + 1);
    midnight.setHours(0, 0, 0, 0);
    const msUntilMidnight = midnight.getTime() - Date.now();
    timeoutRef.current = setTimeout(() => {
      dispatchCd({ type: "TICK" });
      intervalRef.current = setInterval(() => dispatchCd({ type: "TICK" }), 1000 * 60 * 60 * 24);
    }, msUntilMidnight);
    return () => {
      clearTimeout(timeoutRef.current);
      clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <>
      <div ref={sentinelRef} className="pointer-events-none h-px" aria-hidden />

      <div className="card-entrance w-full">
        <div className="relative overflow-hidden rounded-lg bg-secondary/60 px-5 py-5 sm:px-6 sm:py-6">
          {milestone && (
            <div className="card-entrance-down absolute -top-px right-4 left-4 flex items-center justify-center">
              <div className="inline-flex items-center gap-1.5 rounded-b-xl border border-warning/30 bg-warning/20 px-3 py-1">
                <span
                  className="animate-[bounce_1s_ease-in-out_2] text-sm"
                  style={{ animationDelay: "0.15s" }}
                >
                  {milestone.emoji}
                </span>
                <span className="font-extrabold text-warning text-xs uppercase tracking-tight">
                  {milestone.label}
                </span>
              </div>
            </div>
          )}

          <div className="relative z-elevated">
            <h1 className="balance text-wrap font-heading font-semibold text-2xl text-foreground leading-tight tracking-tight sm:text-3xl">
              {greeting}
              {isLoggedIn && name ? (
                <span className="text-system-accent">, {firstName}</span>
              ) : null}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
              {_sessionLoading || !mounted ? (
                <Skeleton className="h-8 w-24 rounded-md" />
              ) : (
                <span
                  className={cn(
                    "card-entrance inline-block font-extrabold font-mono text-4xl text-system-accent tabular-nums tracking-tighter md:text-5xl",
                  )}
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
                  <p className="font-extrabold text-muted-foreground text-xs tabular-nums">
                    until finals
                  </p>
                </div>
              )}
            </div>

            <progress
              className="mt-3 mb-3 h-1.5 w-full overflow-hidden rounded-full bg-border/40 [&::-moz-progress-bar]:bg-primary [&::-webkit-progress-bar]:bg-transparent [&::-webkit-progress-value]:bg-primary"
              value={mounted ? Math.round(yearProgress * 100) : 0}
              max={100}
              aria-label="Year progress: days studied vs total"
            />

            {mounted && (
              <p className="card-entrance mt-1 text-pretty font-medium text-muted-foreground text-xs leading-snug">
                <span className="font-extrabold text-foreground/80">{msg.primary}</span>.{" "}
                {msg.subtitle}
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

      <div
        className={cn(
          "sticky top-0 z-sticky -mx-4 border-border/10 border-b bg-system-background/90 px-4 pt-2 pb-2 transition-[opacity,transform] duration-200 ease-(--ease-ios)",
          isCompact
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-1 pointer-events-none",
        )}
        style={{ viewTransitionName: "countdown-compact" }}
      >
        <div className="mx-auto flex max-w-md items-center gap-3">
          <span className="font-extrabold text-foreground/70 text-xs">
            {greeting}
            {isLoggedIn && name ? `, ${firstName}` : ""}
          </span>
          <span className="ml-auto flex items-baseline gap-1">
            <span className="font-extrabold text-lg text-system-accent tabular-nums">
              {daysLeft}
            </span>
            <span className="font-medium text-muted-foreground text-xs">
              {daysLeft === 1 ? "day" : "days"}
            </span>
          </span>
          <div className="h-1 w-12 overflow-hidden rounded-full bg-border/30">
            <div
              className={cn("h-full rounded-full transition-[width]", cfg.barLight)}
              style={{ width: `${yearProgress * 100}%` }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
