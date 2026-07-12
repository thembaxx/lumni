"use client";

import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon";
import BrainIcon from "@hugeicons/core-free-icons/BrainIcon";
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon";
import ChartUpIcon from "@hugeicons/core-free-icons/ChartUpIcon";
import CheckmarkCircle01Icon from "@hugeicons/core-free-icons/CheckmarkCircle01Icon";
import Mortarboard01Icon from "@hugeicons/core-free-icons/Mortarboard01Icon";
import Timer01Icon from "@hugeicons/core-free-icons/Timer01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { useTranslations } from "next-intl";
import { memo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { FadeIn } from "@/components/shared/fade-in";
import { KineticHeading } from "@/components/shared/kinetic-heading";
import { MagneticCard } from "@/components/shared/magnetic-card";
import { SpotlightCard } from "@/components/shared/motion-primitives";

interface HeroSectionProps {
  isAuthenticated: boolean;
}

function MorphingBlob() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Subtle grayscale blob */}
      <div className="absolute top-[-10%] right-[-10%] h-[60%] w-[50%] bg-linear-to-br from-system-accent/8 via-system-accent/3 to-transparent opacity-60 blur-3xl will-change-transform" />
      <div className="absolute bottom-[-5%] left-[-10%] h-[50%] w-[40%] rounded-full bg-linear-to-tr from-system-accent/5 to-transparent opacity-40 blur-3xl will-change-transform" />
    </div>
  );
}

function InteractiveQuizDemo() {
  const prefersReducedMotion = useReducedMotion();
  const [answer, setAnswer] = useState<number | null>(null);
  const options = [
    { label: "F = ma", value: 0 },
    { label: "E = mc²", value: 1 },
    { label: "PV = nRT", value: 2 },
  ];
  const correct = 0;

  return (
    <MagneticCard className="relative aspect-4/5 w-full max-w-sm" maxTilt={6}>
      <div className="flex h-full w-full flex-col gap-4 rounded-card-lg border border-border/40 bg-card p-5 shadow-level-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-(--system-accent-alpha-10)">
              <HugeiconsIcon icon={BrainIcon} className="size-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">Quick Quiz</p>
              <p className="ios-caption-3 text-muted-foreground">Physics · Grade 12</p>
            </div>
          </div>
          <span className="rounded-full bg-(--system-accent-alpha-10) px-2.5 py-0.5 ios-caption-3 font-medium text-foreground">
            Demo
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <p className="font-medium text-sm leading-relaxed">
            What is Newton's second law of motion?
          </p>
          <div className="flex flex-col gap-1.5">
            {options.map((opt) => {
              const isSelected = answer === opt.value;
              const isCorrect = answer !== null && opt.value === correct;
              const isWrong = answer !== null && isSelected && !isCorrect;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setAnswer(opt.value)}
                  disabled={answer !== null}
                  className={`ripple-container flex items-center gap-2.5 rounded-lg border px-3 py-3 text-left text-xs transition-[border-color,background-color,color,transform] duration-200 focus-visible:ring-2 focus-visible:ring-primary ${
                    isCorrect
                      ? "border-success/40 bg-success/10 text-success"
                      : isWrong
                        ? "border-destructive/40 bg-destructive/10 text-destructive"
                        : isSelected
                          ? "border-primary/40 bg-(--system-accent-alpha-10)"
                          : "border-border/40 bg-system-background-secondary/60 hover:border-primary/30 hover:scale-[1.01]"
                  } ${answer !== null ? "cursor-default" : "cursor-pointer active:scale-[0.96]"}`}
                >
                  <span
                    className={`flex size-5 shrink-0 items-center justify-center rounded-md border ios-caption-3 ${
                      isCorrect
                        ? "border-success/40 bg-success text-white"
                        : isWrong
                          ? "border-destructive/40 bg-destructive text-white"
                          : "border-border/50 text-muted-foreground"
                    }`}
                  >
                    {isCorrect ? (
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-3.5" />
                    ) : isWrong ? (
                      <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
                    ) : (
                      String.fromCharCode(65 + opt.value)
                    )}
                  </span>
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {answer !== null && (
          <m.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
            className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-success text-xs"
          >
            <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-4 shrink-0" />
            {answer === correct
              ? "Correct! Force equals mass × acceleration."
              : "Not quite. Try F = ma."}
          </m.div>
        )}

        <div className="mt-auto flex items-center justify-center gap-1.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-[width,background-color] duration-300 ${
                i < 1 ? "w-4 bg-primary" : "w-1 bg-border/50"
              }`}
            />
          ))}
        </div>
      </div>
    </MagneticCard>
  );
}

export const HeroSection = memo(function HeroSection({ isAuthenticated }: HeroSectionProps) {
  const t = useTranslations();

  return (
    <section
      id="main-content"
      className="relative flex min-h-dvh items-center overflow-hidden pt-14"
    >
      <MorphingBlob />
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="grid items-center gap-12 py-20 lg:grid-cols-2">
          <div className="flex flex-col gap-8">
            <FadeIn direction="up" distance={20} duration={0.4} className="flex flex-col gap-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-(--system-accent-alpha-10) px-4 py-1.5 text-xs text-foreground shadow-level-2 border border-primary/10">
                <span className="text-primary/60 ios-caption-3" aria-hidden="true">
                  ✦
                </span>
                {t("home.heroTagline")}
              </div>
              <KineticHeading
                as="h1"
                className="ios-large-title leading-[1.05] tracking-[0.012em] sm:text-5xl lg:text-6xl"
                staggerMs={25}
              >
                {t("home.heroTitle")}
              </KineticHeading>
              <p className="max-w-lg text-lg text-muted-foreground leading-relaxed">
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
                  className="group relative w-full gap-2 bg-primary text-primary-foreground shadow-level-2 transition-[scale,background-color,box-shadow,color,transform] duration-300 hover:shadow-level-3 press-scale sm:w-auto"
                >
                  <Link href="/dashboard">
                    {t("home.heroDashboard")}
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                      data-icon="inline-end"
                    />
                  </Link>
                </Button>
              ) : (
                <Button
                  asChild
                  size="lg"
                  className="group relative w-full gap-2 bg-primary text-primary-foreground shadow-level-2 transition-[scale,background-color,box-shadow,color,transform] duration-300 hover:shadow-level-3 press-scale sm:w-auto"
                >
                  <Link href="/dashboard">
                    {t("home.heroStartFree")}
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                      data-icon="inline-end"
                    />
                  </Link>
                </Button>
              )}
              {!isAuthenticated && (
                <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                  <Link href="/auth/sign-in">{t("home.navSignIn")}</Link>
                </Button>
              )}

              <div className="hidden items-center gap-2 rounded-full border border-border/30 bg-system-background-secondary px-3 py-1.5 text-muted-foreground text-xs sm:flex">
                <span className="relative flex size-2">
                  <span className="inline-flex size-2 rounded-full bg-success" />
                </span>
                No credit card
              </div>
            </FadeIn>

            <FadeIn
              distance={0}
              delay={0.2}
              duration={0.4}
              className="flex flex-wrap items-center gap-6 text-muted-foreground text-sm"
            >
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={Mortarboard01Icon} className="size-4 text-primary/60" />
                <span>{t("home.heroBadgeCaps")}</span>
              </div>
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={Timer01Icon} className="size-4 text-primary/60" />
                <span>{t("home.heroBadgePapers")}</span>
              </div>
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={ChartUpIcon} className="size-4 text-primary/60" />
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
            <SpotlightCard className="rounded-card-lg" radius={300}>
              <InteractiveQuizDemo />
            </SpotlightCard>
          </FadeIn>
        </div>
      </div>
    </section>
  );
});
