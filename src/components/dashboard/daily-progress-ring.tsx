"use client";

import CheckmarkCircle01Icon from "@hugeicons/core-free-icons/CheckmarkCircle01Icon";
import Fire02FreeIcons from "@hugeicons/core-free-icons/Fire02Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { AnimatedProgressBar } from "@/components/shared/animated-progress-bar";
import { RadialChart } from "@/components/ui/charts/radial-chart";
import { useGamification } from "@/hooks/use-gamification";
import { FadeIn } from "@/components/shared/fade-in";
import { iOSEase } from "@/lib/utils/animation";

export function DailyProgressRing() {
  const { levelInfo, gamification, currentStreak } = useGamification();
  const shouldReduceMotion = useReducedMotion();

  const daily = gamification.dailyChallenges[0];
  const progress = daily ? Math.min(daily.progress / daily.target, 1) : 0;
  const isComplete = daily?.completed ?? false;

  return (
    <FadeIn
      direction="scale"
      scaleDistance={0.92}
      duration={0.5}
      className="flex flex-col items-center py-4 motion-reduce:animate-none motion-reduce:transition-none"
    >
      <RadialChart
        value={progress * 100}
        size={136}
        color={isComplete ? "var(--success)" : "var(--system-accent)"}
      >
        <div className="flex flex-col items-center">
          <m.span
            initial={shouldReduceMotion ? false : { scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: 0.4,
              ease: iOSEase,
              delay: shouldReduceMotion ? 0 : 0.2,
            }}
            className="font-extrabold text-3xl text-foreground tabular-nums"
          >
            {levelInfo.level}
          </m.span>
          <span className="ios-caption-2 font-extrabold text-muted-foreground uppercase tracking-wider">
            {levelInfo.title}
          </span>
        </div>
      </RadialChart>

      <div className="mt-4 flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <m.span
            animate={shouldReduceMotion || currentStreak === 0 ? {} : { scale: [1, 1.2, 1] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: iOSEase,
            }}
          >
            <HugeiconsIcon
              icon={Fire02FreeIcons}
              className={`size-5 transition-colors duration-300 ${currentStreak > 0 ? "text-warning" : "text-muted-foreground"}`}
            />
          </m.span>
          <span className="font-extrabold text-foreground text-lg tabular-nums">
            {currentStreak}
          </span>
          <span className="font-medium text-muted-foreground text-xs">day streak</span>
        </div>
        <div className="h-6 w-px bg-border/40" />
        <div className="text-right">
          <p className="font-extrabold text-foreground text-lg tabular-nums">
            {gamification.totalXp.toLocaleString("en-ZA")}
          </p>
          <p className="font-medium text-muted-foreground text-xs">total XP</p>
        </div>
      </div>

      <m.div
        className="mt-3 flex items-center gap-2"
        animate={isComplete && !shouldReduceMotion ? { scale: [1, 1.02, 1] } : { scale: 1 }}
        transition={{
          duration: 2,
          repeat: isComplete ? Infinity : 0,
          ease: iOSEase,
        }}
      >
        <AnimatedProgressBar
          value={progress * 100}
          size="md"
          color={isComplete ? "success" : "accent"}
          trackClassName="bg-border/40"
          className="w-32"
        />
        <span className="font-medium text-muted-foreground text-xs tabular-nums">
          {daily?.progress ?? 0} / {daily?.target ?? 10}
        </span>
      </m.div>
      <div className="relative mt-0.5 flex h-5 items-center justify-center">
        <AnimatePresence mode="wait" initial={false}>
          {isComplete ? (
            <m.div
              key="complete"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", duration: 0.3, bounce: 0 }}
              className="flex items-center gap-1"
            >
              <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-3.5 text-success" />
              <span className="ios-caption-2 font-extrabold text-success">Daily goal complete</span>
            </m.div>
          ) : (
            <m.p
              key="incomplete"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="ios-caption-2 font-medium text-muted-foreground"
            >
              questions today
            </m.p>
          )}
        </AnimatePresence>
      </div>
    </FadeIn>
  );
}
