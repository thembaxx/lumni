"use client";

import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon";
import BrainIcon from "@hugeicons/core-free-icons/BrainIcon";
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon";
import CheckmarkCircle01Icon from "@hugeicons/core-free-icons/CheckmarkCircle01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { useTranslations } from "next-intl";
import { memo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { MagneticCard } from "@/components/shared/magnetic-card";

interface HeroSectionProps {
  isAuthenticated: boolean;
}

function InteractiveQuizDemo() {
  const prefersReducedMotion = useReducedMotion();
  const [answer, setAnswer] = useState<number | null>(null);
  const options = [
    { label: "F = ma", value: 0 },
    { label: "E = mc", value: 1 },
    { label: "PV = nRT", value: 2 },
  ];
  const correct = 0;

  return (
    <MagneticCard className="relative w-full" maxTilt={4}>
      <div className="flex h-full w-full flex-col gap-3 rounded-card-lg border border-border/30 bg-card/90 p-5 shadow-level-2 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-(--system-accent-alpha-10)">
              <HugeiconsIcon icon={BrainIcon} className="size-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-xs">Quick Quiz</p>
              <p className="text-muted-foreground text-[10px]">Physics - Grade 12</p>
            </div>
          </div>
          <span className="rounded-full bg-(--system-accent-alpha-10) px-2 py-0.5 text-[10px] font-medium text-foreground">
            Demo
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <p className="font-medium text-xs leading-relaxed">
            What is Newton&apos;s second law of motion?
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
                  className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-[11px] transition-[border-color,background-color,color,transform] duration-200 focus-visible:ring-2 focus-visible:ring-primary ${
                    isCorrect
                      ? "border-success/40 bg-success/10 text-success"
                      : isWrong
                        ? "border-destructive/40 bg-destructive/10 text-destructive"
                        : isSelected
                          ? "border-primary/40 bg-(--system-accent-alpha-10)"
                          : "border-border/40 bg-system-background-secondary/60 hover:border-primary/30 hoverable:scale-[1.01]"
                  } ${answer !== null ? "cursor-default" : "cursor-pointer active:scale-[0.96]"}`}
                >
                  <span
                    className={`flex size-4 shrink-0 items-center justify-center rounded border text-[9px] ${
                      isCorrect
                        ? "border-success/40 bg-success text-white"
                        : isWrong
                          ? "border-destructive/40 bg-destructive text-white"
                          : "border-border/50 text-muted-foreground"
                    }`}
                  >
                    {isCorrect ? (
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-3" />
                    ) : isWrong ? (
                      <HugeiconsIcon icon={Cancel01Icon} className="size-3" />
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
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
            className="flex items-center gap-1.5 rounded-lg bg-success/10 px-2.5 py-1.5 text-success text-[10px]"
          >
            <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-3 shrink-0" />
            {answer === correct
              ? "Correct! Force = mass x acceleration."
              : "Not quite. Try F = ma."}
          </m.div>
        )}

        <div className="mt-auto flex items-center justify-center gap-1.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-0.5 rounded-full transition-[width,background-color] duration-300 ${
                i < 1 ? "w-3 bg-primary" : "w-0.5 bg-border/50"
              }`}
            />
          ))}
        </div>
      </div>
    </MagneticCard>
  );
}

// Inline image pill rendered inside the heading
function InlineImagePill() {
  return (
    <span
      className="relative mx-2 inline-block h-7 w-16 overflow-hidden rounded-full align-middle md:h-8 md:w-20"
      aria-hidden="true"
    >
      <span
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url(https://picsum.photos/seed/graduate/200/80)" }}
      />
    </span>
  );
}

export const HeroSection = memo(function HeroSection({ isAuthenticated }: HeroSectionProps) {
  const t = useTranslations();
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      id="main-content"
      className="relative flex min-h-[90dvh] items-center justify-center overflow-hidden pt-14"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity"
          style={{ backgroundImage: "url(https://picsum.photos/seed/matric/1920/1080)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-system-background via-system-background/80 to-system-background" />
        <div className="absolute top-1/4 right-1/4 h-96 w-96 rounded-full bg-system-accent/8 blur-3xl" />
        <div className="absolute bottom-1/3 left-1/3 h-64 w-64 rounded-full bg-system-accent/5 blur-3xl" />
      </div>

      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center gap-12 px-4 py-20 md:flex-row md:gap-16 lg:py-24">
        <m.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.7, delay: 0.1 }}
          className="flex flex-1 flex-col items-center gap-6 text-center md:items-start md:text-left"
        >
          <m.h1
            className="max-w-5xl text-[clamp(2.2rem,6vw,4.5rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-foreground"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.6, delay: 0.2 }}
          >
            Pass your Matric
            <br />
            <InlineImagePill />
            with confidence
          </m.h1>

          <m.p
            className="max-w-lg text-balance text-base leading-relaxed text-muted-foreground md:text-lg"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.5, delay: 0.35 }}
          >
            {t("home.heroDesc")}
          </m.p>

          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.5, delay: 0.5 }}
            className="flex flex-col gap-3 sm:flex-row"
          >
            {isAuthenticated ? (
              <Button
                asChild
                size="lg"
                className="group relative gap-2 bg-primary text-primary-foreground shadow-level-2 transition-all duration-300 hover:shadow-level-3 press-scale"
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
                className="group relative gap-2 bg-primary text-primary-foreground shadow-level-2 transition-all duration-300 hover:shadow-level-3 press-scale"
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
              <Button asChild variant="outline" size="lg" className="border-border/40 press-scale">
                <Link href="/auth/sign-in">{t("home.navSignIn")}</Link>
              </Button>
            )}
          </m.div>
        </m.div>

        <m.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.7, delay: 0.4 }}
          className="w-full max-w-xs shrink-0 md:max-w-sm"
        >
          <InteractiveQuizDemo />
        </m.div>
      </div>
    </section>
  );
});
