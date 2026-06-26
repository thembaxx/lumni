"use client";

import BrainIcon from "@hugeicons/core-free-icons/BrainIcon";
import ChartUpIcon from "@hugeicons/core-free-icons/ChartUpIcon";
import CheckmarkCircle01Icon from "@hugeicons/core-free-icons/CheckmarkCircle01Icon";
import Mortarboard01Icon from "@hugeicons/core-free-icons/Mortarboard01Icon";
import SparklesIcon from "@hugeicons/core-free-icons/SparklesIcon";
import Timer01Icon from "@hugeicons/core-free-icons/Timer01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useReducedMotion, useScroll, useTransform } from "motion/react";
import * as m from "motion/react-m";
import { useTranslations } from "next-intl";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { FadeIn } from "@/components/shared/fade-in";

interface HeroSectionProps {
  isAuthenticated: boolean;
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
                <Button
                  asChild
                  size="lg"
                  className="w-full gap-2 bg-primary text-primary-foreground shadow-level-2 transition-[transform,box-shadow] duration-200 hover:shadow-level-3 active:scale-[0.97] sm:w-auto"
                >
                  <Link href="/dashboard">{t("home.heroDashboard")}</Link>
                </Button>
              ) : (
                <Button
                  asChild
                  size="lg"
                  className="w-full gap-2 bg-primary text-primary-foreground shadow-level-2 transition-[transform,box-shadow] duration-200 hover:shadow-level-3 active:scale-[0.97] sm:w-auto"
                >
                  <Link href="/dashboard">{t("home.heroStartFree")}</Link>
                </Button>
              )}
              {!isAuthenticated && (
                <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                  <Link href="/auth/sign-in">{t("home.navSignIn")}</Link>
                </Button>
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
              <div className="flex items-center gap-2 rounded-full bg-(--system-accent-alpha-10) px-3 py-1.5">
                <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-4 text-primary" />
                <span className="font-medium text-xs">CAPS Aligned</span>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-(--system-accent-alpha-10) px-3 py-1.5">
                <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-4 text-primary" />
                <span className="font-medium text-xs">Covers 2020–2025 Papers</span>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-(--system-accent-alpha-10) px-3 py-1.5">
                <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-4 text-primary" />
                <span className="font-medium text-xs">14 NSC Subjects</span>
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
                </div>
                <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-lg bg-system-background-secondary/80 p-5">
                  <svg
                    className="size-12 text-primary/40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    aria-hidden="true"
                  >
                    <path d="M12 3c.5 0 1 .2 1.4.6.4.4.6.9.6 1.4v.5c0 .5-.2 1-.6 1.4C13 7.4 12.5 7.6 12 7.6" />
                    <path d="M12 3c-.5 0-1 .2-1.4.6-.4.4-.6.9-.6 1.4v.5c0 .5.2 1 .6 1.4C11 7.4 11.5 7.6 12 7.6" />
                    <path d="M12 7.6v5.7" />
                    <path d="M9 14.3c.7.7 1.7 1.1 2.7 1.1h.6c1 0 2-.4 2.7-1.1" />
                    <circle cx="12" cy="18" r="1.5" />
                    <circle cx="12" cy="18" r="3" strokeDasharray="1 1" />
                  </svg>
                  <p className="text-center text-muted-foreground text-sm">
                    AI-powered quizzes that adapt to your level
                  </p>
                </div>
                <div className="flex items-center justify-center">
                  <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary text-xs">
                    Start learning in 30 seconds
                  </span>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </m.section>
  );
});
