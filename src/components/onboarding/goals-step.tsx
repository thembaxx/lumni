"use client";

import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { iOSEase } from "@/lib/utils/animation";

interface GoalsStepProps {
  targetAps: number;
  dailyMinutes: number;
  onTargetApsChange: (v: number) => void;
  onDailyMinutesChange: (v: number) => void;
}

export function GoalsStep({
  targetAps,
  dailyMinutes,
  onTargetApsChange,
  onDailyMinutesChange,
}: GoalsStepProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <m.div
      initial={shouldReduceMotion ? {} : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: 0.15,
        ease: iOSEase,
      }}
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col gap-2">
        <div className="font-bold text-4xl text-foreground tabular-nums">{targetAps}</div>
        <p className="ios-subhead text-muted-foreground">Target APS</p>
        <div>
          <Slider
            min={20}
            max={50}
            value={[targetAps]}
            onValueChange={(v) => onTargetApsChange(Array.isArray(v) ? v[0] : v)}
          />
          <div className="flex justify-between text-muted-foreground text-xs">
            <span>20 (Minimum)</span>
            <span>50 (Top)</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="font-bold text-4xl text-foreground tabular-nums">{dailyMinutes}</div>
        <p className="ios-subhead text-muted-foreground">Minutes per day</p>
        <div>
          <Slider
            min={10}
            max={120}
            step={10}
            value={[dailyMinutes]}
            onValueChange={(v) => onDailyMinutesChange(Array.isArray(v) ? v[0] : v)}
          />
          <div className="flex justify-between text-muted-foreground text-xs">
            <span>10 min</span>
            <span>120 min</span>
          </div>
        </div>
        <div className="flex gap-2">
          {[15, 30, 45, 60].map((m) => (
            <Button
              key={m}
              variant={dailyMinutes === m ? "default" : "outline"}
              size="sm"
              onClick={() => onDailyMinutesChange(m)}
              className="flex-1"
            >
              {m}min
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-system-surface-secondary p-4">
        <p className="text-muted-foreground text-sm">
          <strong className="text-foreground">Tip:</strong> Most universities need 23-27 APS.
          Medicine and Engineering typically need 35+.
        </p>
      </div>
    </m.div>
  );
}
