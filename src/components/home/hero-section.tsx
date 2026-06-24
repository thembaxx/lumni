"use client";

import BrainIcon from "@hugeicons/core-free-icons/BrainIcon";
import CancelCircleIcon from "@hugeicons/core-free-icons/CancelCircleIcon";
import ChartUpIcon from "@hugeicons/core-free-icons/ChartUpIcon";
import CheckmarkCircle01Icon from "@hugeicons/core-free-icons/CheckmarkCircle01Icon";
import Mortarboard01Icon from "@hugeicons/core-free-icons/Mortarboard01Icon";
import SparklesIcon from "@hugeicons/core-free-icons/SparklesIcon";
import Timer01Icon from "@hugeicons/core-free-icons/Timer01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useInView, useReducedMotion, useScroll, useTransform } from "motion/react";
import * as m from "motion/react-m";
import { useTranslations } from "next-intl";
import { memo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { FadeIn } from "@/components/shared/fade-in";

interface HeroSectionProps {
  isAuthenticated: boolean;
}

function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const displayValue = isInView ? value : 0;

  return (
    <span ref={ref} className="tabular-nums">
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  );
}

export const HeroSection = memo(function HeroSection({ isAuthenticated }: HeroSectionProps) {
  const t = useTranslations();
  const prefersReducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, prefersReducedMotion ? 1 : 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, prefersReducedMotion ? 1 : 0.98]);

  return (
    <m.section
      id="main-content"
      style={{ opacity: heroOpacity, scale: heroScale }}
      className="relative flex min-h-dvh items-center pt-14"
    >
      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-primary/5 via-transparent to-transparent" />
      <div className="absolute top-1/4 -left-20 size-96 animate-blob-orbit rounded-full bg-primary/10 opacity-60 will-change-transform" />
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="grid items-center gap-12 py-20 lg:grid-cols-2">
          <div className="flex flex-col gap-8">
            <FadeIn direction="up" distance={20} duration={0.4}>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-(--system-accent-alpha-10) px-3 py-1 font-medium text-primary text-xs">
                <HugeiconsIcon icon={SparklesIcon} className="size-3" />
                {t("home.heroTagline")}
              </div>
              <h1 className="ios-large-title leading-[1.1] sm:text-5xl lg:text-6xl">
                {t("home.heroTitle")}
                <span className="text-primary">{t("home.heroTitleHighlight")}</span>
              </h1>
              <p className="mt-4 max-w-lg text-lg text-muted-foreground leading-relaxed">
                {t("home.heroDesc")}
              </p>
            </FadeIn>

            <FadeIn
              direction="up"
              distance={20}
              duration={0.4}
              delay={0.1}
              className="flex flex-col gap-3 sm:flex-row"
            >
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button
                    size="lg"
                    className="w-full gap-2 bg-primary text-primary-foreground shadow-level-2 transition-[transform,box-shadow] duration-300 hover:shadow-level-3 active:scale-[0.97] sm:w-auto"
                  >
                    {t("home.heroDashboard")}
                  </Button>
                </Link>
              ) : (
                <Link href="/dashboard">
                  <Button
                    size="lg"
                    className="w-full gap-2 bg-primary text-primary-foreground shadow-level-2 transition-[transform,box-shadow] duration-300 hover:shadow-level-3 active:scale-[0.97] sm:w-auto"
                  >
                    {t("home.heroStartFree")}
                  </Button>
                </Link>
              )}
              {!isAuthenticated && (
                <Link href="/auth/sign-in">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    {t("home.navSignIn")}
                  </Button>
                </Link>
              )}
            </FadeIn>

            <FadeIn
              distance={0}
              delay={0.2}
              duration={0.4}
              className="flex flex-wrap items-center gap-6 text-muted-foreground text-sm"
            >
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={Mortarboard01Icon} className="size-4" />
                <span>{t("home.heroBadgeCaps")}</span>
              </div>
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={Timer01Icon} className="size-4" />
                <span>{t("home.heroBadgePapers")}</span>
              </div>
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={ChartUpIcon} className="size-4" />
                <span>{t("home.heroBadgeAi")}</span>
              </div>
            </FadeIn>

            <FadeIn
              direction="up"
              distance={16}
              duration={0.4}
              delay={0.3}
              className="flex flex-wrap items-center gap-x-8 gap-y-3 pt-2"
            >
              <div className="flex flex-col">
                <span className="font-bold text-2xl text-foreground tabular-nums tracking-tight">
                  <AnimatedCounter value={50000} suffix="+" />
                </span>
                <span className="text-muted-foreground text-xs">Questions answered</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-2xl text-foreground tabular-nums tracking-tight">
                  <AnimatedCounter value={14} suffix="" />
                </span>
                <span className="text-muted-foreground text-xs">NSC Subjects</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-2xl text-foreground tabular-nums tracking-tight">
                  <AnimatedCounter value={1000} suffix="+" />
                </span>
                <span className="text-muted-foreground text-xs">Past papers</span>
              </div>
            </FadeIn>
          </div>

          <FadeIn
            direction="scale"
            scaleDistance={0.9}
            duration={0.5}
            delay={0.15}
            className="relative hidden items-center justify-center lg:flex"
          >
            <div className="relative aspect-[4/5] w-full max-w-sm">
              <div className="absolute inset-0 rounded-card-lg bg-linear-to-br from-primary/20 via-primary/5 to-transparent blur-3xl" />
              <div className="relative flex h-full w-full flex-col gap-5 rounded-card-lg border border-border/50 bg-linear-to-br from-primary/5 to-background p-6 shadow-level-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-md bg-(--system-accent-alpha-10)">
                      <HugeiconsIcon icon={BrainIcon} className="size-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{t("home.demoQuiz")}</p>
                      <p className="ios-caption-3 text-muted-foreground">{t("home.demoSubject")}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-muted/50 px-2.5 py-0.5 font-medium text-muted-foreground text-xs tabular-nums">
                    {t("home.demoProgress", { current: 4, total: 10 })}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-4 rounded-lg bg-system-background-secondary/80 p-5">
                  <p className="font-medium text-sm leading-relaxed">
                    What is the derivative of{" "}
                    <span className="font-semibold text-foreground">sin(x²)</span>?
                  </p>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2.5 rounded-md border border-success/30 bg-success/10 px-3 py-2.5">
                      <HugeiconsIcon
                        icon={CheckmarkCircle01Icon}
                        className="size-4 shrink-0 text-success"
                      />
                      <span className="font-medium text-success text-xs">2x cos(x²)</span>
                    </div>
                    <div className="flex items-center gap-2.5 rounded-md border border-border/50 px-3 py-2.5">
                      <div className="size-4 shrink-0 rounded-full border-2 border-border/50" />
                      <span className="text-muted-foreground text-xs">cos(x²)</span>
                    </div>
                    <div className="flex items-center gap-2.5 rounded-md border border-border/50 px-3 py-2.5">
                      <div className="size-4 shrink-0 rounded-full border-2 border-border/50" />
                      <span className="text-muted-foreground text-xs">2x sin(x²)</span>
                    </div>
                    <div className="flex items-center gap-2.5 rounded-md border border-destructive/20 px-3 py-2.5">
                      <HugeiconsIcon
                        icon={CancelCircleIcon}
                        className="size-4 shrink-0 text-destructive"
                      />
                      <span className="text-muted-foreground text-xs line-through">sin(2x)</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="flex size-6 items-center justify-center rounded-full bg-success/20">
                      <div className="size-2 rounded-full bg-success" />
                    </div>
                    <span className="font-medium text-success text-xs">{t("home.demoScore")}</span>
                  </div>
                  <div className="flex gap-1">
                    <div className="size-2 rounded-full bg-success" />
                    <div className="size-2 rounded-full bg-success" />
                    <div className="size-2 rounded-full bg-success" />
                    <div className="size-2 rounded-full bg-muted-foreground/20" />
                    <div className="size-2 rounded-full bg-muted-foreground/20" />
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </m.section>
  );
});
