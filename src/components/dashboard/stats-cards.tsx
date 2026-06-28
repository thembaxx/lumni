"use client";

import CheckmarkCircle01Icon from "@hugeicons/core-free-icons/CheckmarkCircle01Icon";
import Target01Icon from "@hugeicons/core-free-icons/Target01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { memo } from "react";
import { FadeIn } from "@/components/shared/fade-in";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAnimatedNumber } from "@/hooks/use-animated-number";

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

function AnimatedNumber({ value }: { value: number }) {
  const displayValue = useAnimatedNumber(value, 400, true);
  return <span aria-live="polite">{displayValue}</span>;
}

function StatCard({ label, value, icon: Icon, colorClass, index }: StatItemProps) {
  return (
    <FadeIn direction="up" distance={8} duration={0.35} delay={index * 0.05}>
      <Card className="relative h-full cursor-default gap-3 py-5 transition-colors hover:border-border/80">
        <CardHeader className="flex flex-col items-center justify-center border-t-0 px-5 pt-0">
          <div className="relative flex size-10 items-center justify-center rounded-full bg-system-surface shadow-level-1">
            <HugeiconsIcon icon={Icon} className={`size-6 ${colorClass}`} />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 px-5 pb-0 text-center">
          <p className="balance text-wrap font-extrabold text-2xl text-foreground tabular-nums tracking-tight">
            <AnimatedNumber value={value} />
          </p>
          <p className="font-extrabold text-muted-foreground text-xs uppercase leading-tight tracking-wider">
            {label}
          </p>
        </CardContent>
      </Card>
    </FadeIn>
  );
}

export const StatsCards = memo(function StatsCards({ questionsAnswered, streak }: StatsCardsProps) {
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
        <FadeIn key={label} direction="up" distance={8} duration={0.35} delay={index * 0.05}>
          <StatCard
            label={label}
            value={value}
            icon={icon}
            colorClass={colorClass}
            accentClass={accentClass}
            index={index}
          />
        </FadeIn>
      ))}
    </div>
  );
});
