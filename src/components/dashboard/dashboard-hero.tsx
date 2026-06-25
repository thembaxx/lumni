"use client";

import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { useTranslations } from "next-intl";
import { FadeIn } from "@/components/shared/fade-in";
import { PerpetualFloat } from "@/components/shared/perpetual-float";
import { iOSEase } from "@/lib/utils/animation";
import { useOptimizedAnimation } from "@/lib/utils/animation-optimization";

export function HeroBanner() {
  const t = useTranslations();
  const shouldReduceMotion = useReducedMotion();
  const { shouldReduceMotion: shouldReduceMotionOpt } = useOptimizedAnimation();
  const finalShouldReduceMotion = shouldReduceMotion || shouldReduceMotionOpt;

  return (
    <FadeIn
      direction="down"
      distance={12}
      duration={0.5}
      className="relative mt-4 mb-2 overflow-hidden rounded-card-lg bg-linear-to-br from-(--system-accent)/10 via-(--system-accent)/5 to-transparent shadow-level-2"
      aria-label="Dashboard header showing welcome message"
      role="banner"
    >
      {!finalShouldReduceMotion && (
        <PerpetualFloat
          className="absolute top-1/2 right-8 -translate-y-1/2"
          duration={8}
          offsetY={-16}
          aria-hidden="true"
        >
          <div className="size-20 rounded-2xl bg-(--system-accent)/10 blur-xl" />
        </PerpetualFloat>
      )}

      <div className="relative flex max-w-3xl flex-col justify-center px-8 py-6">
        <m.h1
          className="ios-title-1 max-w-lg font-extrabold text-foreground leading-tight tracking-tight"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: iOSEase }}
        >
          {t("dashboard.title")}
        </m.h1>
        <m.p
          className="mt-2 max-w-md text-muted-foreground text-sm"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: iOSEase }}
        >
          {t("dashboard.subtitle")}
        </m.p>
      </div>
    </FadeIn>
  );
}
