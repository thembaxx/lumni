"use client";

import BookOpen01Icon from "@hugeicons/core-free-icons/BookOpen01Icon";
import ChartUpIcon from "@hugeicons/core-free-icons/ChartUpIcon";
import Target01Icon from "@hugeicons/core-free-icons/Target01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { useTranslations } from "next-intl";
import { motionEase } from "@/lib/utils/animation";

const stepsConfig = [
  {
    icon: BookOpen01Icon,
    titleKey: "howStep1Title",
    descKey: "howStep1Desc",
  },
  {
    icon: Target01Icon,
    titleKey: "howStep2Title",
    descKey: "howStep2Desc",
  },
  {
    icon: ChartUpIcon,
    titleKey: "howStep3Title",
    descKey: "howStep3Desc",
  },
];

export function HowItWorksSection() {
  const t = useTranslations("home");
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-system-background-secondary py-20 md:py-28">
      <div className="pointer-events-none absolute top-1/2 left-1/2 size-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
      <div className="mx-auto max-w-6xl px-4">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={prefersReducedMotion ? undefined : { duration: 0.4 }}
          className="flex flex-col gap-3 mb-16 max-w-2xl"
        >
          <h2 className="ios-title-1 font-bold text-foreground tracking-tight">
            {t("howHeading")}
          </h2>
          <p className="ios-body max-w-lg text-muted-foreground">{t("howSubheading")}</p>
        </m.div>

        <div className="grid gap-6 md:grid-cols-3">
          {stepsConfig.map((step, i) => (
            <m.div
              key={step.titleKey}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={
                prefersReducedMotion
                  ? undefined
                  : { delay: i * 0.12, duration: 0.6, ease: motionEase }
              }
              className="relative flex flex-col gap-4 rounded-card border border-border/30 bg-card p-6 shadow-level-1"
            >
              <div className="flex size-12 items-center justify-center rounded-xl bg-(--system-accent-alpha-10)">
                <HugeiconsIcon icon={step.icon} className="size-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">{t(step.titleKey)}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{t(step.descKey)}</p>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}
