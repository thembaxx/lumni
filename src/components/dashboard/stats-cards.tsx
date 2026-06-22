"use client";

import CheckmarkCircle01Icon from "@hugeicons/core-free-icons/CheckmarkCircle01Icon";
import Target01Icon from "@hugeicons/core-free-icons/Target01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import * as m from "motion/react-m";
import { memo, useEffect } from "react";
import { PerpetualFloat } from "@/components/shared/perpetual-float";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { iOSEase } from "@/lib/utils/animation";
import { useOptimizedAnimation } from "@/lib/utils/animation-optimization";

interface StatsCardsProps {
  questionsAnswered: number;
  streak: number;
}

interface StatItemProps {
  label: string;
  value: number;
  icon: typeof CheckmarkCircle01Icon;
  colorClass: string;
  accentClass: string;
  index: number;
}
function AnimatedNumber({
  value,
  shouldReduceMotion,
}: {
  value: number;
  shouldReduceMotion: boolean | null;
}) {
  const { shouldReduceMotion: animShouldReduce } = useOptimizedAnimation();
  const finalShouldReduceMotion = shouldReduceMotion || animShouldReduce;
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    stiffness: 80,
    damping: 26,
  });
  const rounded = useTransform(springValue, (v) => Math.round(v));

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  if (finalShouldReduceMotion) {
    return <>{value}</>;
  }

  return <m.span aria-live="polite">{rounded}</m.span>;
}

function StatCard({
  label,
  value,
  icon: Icon,
  colorClass,
  accentClass: _accentClass,
  index,
}: StatItemProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <m.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.35,
        ease: iOSEase,
        delay: shouldReduceMotion ? 0 : index * 0.05,
      }}
    >
      <Card className="relative h-full cursor-default gap-3 py-5 transition-colors hover:border-border/80">
        <CardHeader className="flex flex-col items-center justify-center border-t-0 px-5 pt-0">
          <div className="relative flex size-10 items-center justify-center rounded-full bg-system-surface shadow-level-1">
            <PerpetualFloat floatRange={2} speed={4} cycles={3}>
              <HugeiconsIcon icon={Icon} className={`size-6 ${colorClass}`} />
            </PerpetualFloat>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 px-5 pb-0 text-center">
          <p className="balance text-wrap font-extrabold text-2xl text-foreground tabular-nums tracking-tight">
            <AnimatedNumber value={value} shouldReduceMotion={shouldReduceMotion} />
          </p>
          <p className="font-extrabold text-muted-foreground text-xs uppercase leading-tight tracking-wider">
            {label}
          </p>
        </CardContent>
      </Card>
    </m.div>
  );
}

export const StatsCards = memo(function StatsCards({ questionsAnswered, streak }: StatsCardsProps) {
  const { shouldReduceMotion: shouldReduceMotionOpt } = useOptimizedAnimation();
  const finalShouldReduceMotion = shouldReduceMotionOpt;

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3">
      {[
        {
          label: "Questions",
          value: questionsAnswered,
          icon: Target01Icon,
          colorClass: "text-info",
          accentClass: "hover:text-info/80",
          index: 0,
        },
        {
          label: "Day Streak",
          value: streak,
          icon: CheckmarkCircle01Icon,
          colorClass: "text-warning",
          accentClass: "hover:text-warning/80",
          index: 1,
        },
      ].map(({ label, value, icon, colorClass, accentClass, index }) => (
        <m.div
          key={label}
          initial={{ opacity: 0, y: 8 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: {
              duration: finalShouldReduceMotion ? 0 : 0.35,
              ease: iOSEase,
              delay: finalShouldReduceMotion ? 0 : index * 0.05,
            },
          }}
        >
          <StatCard
            label={label}
            value={value}
            icon={icon}
            colorClass={colorClass}
            accentClass={accentClass}
            index={index}
          />
        </m.div>
      ))}
    </div>
  );
});
