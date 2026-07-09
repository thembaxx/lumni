"use client";

import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { useTranslations } from "next-intl";
import { motionEase } from "@/lib/utils/animation";

const stepsConfig = [
  {
    number: "01",
    titleKey: "howStep1Title",
    descKey: "howStep1Desc",
    gradient: "from-primary/20 to-primary/5",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    number: "02",
    titleKey: "howStep2Title",
    descKey: "howStep2Desc",
    gradient: "from-chart-4/20 to-chart-4/5",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    number: "03",
    titleKey: "howStep3Title",
    descKey: "howStep3Desc",
    gradient: "from-chart-2/20 to-chart-2/5",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
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
          className="flex flex-col gap-3 mb-16 text-center"
        >
          <h2 className="ios-title-1 font-bold text-foreground tracking-tight">
            {t("howHeading")}
          </h2>
          <p className="ios-body mx-auto max-w-lg text-muted-foreground">{t("howSubheading")}</p>
        </m.div>

        <div className="relative mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          <div className="absolute top-12 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] hidden h-px bg-linear-to-r from-transparent via-border/50 to-transparent md:block" />

          {stepsConfig.map((step, i) => (
            <m.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={
                prefersReducedMotion
                  ? undefined
                  : { delay: i * 0.12, duration: 0.6, ease: motionEase }
              }
              className="relative flex flex-col items-center gap-2 text-center"
            >
              <div className="relative mb-5">
                <div
                  className={`flex size-16 items-center justify-center rounded-2xl bg-linear-to-br ${step.gradient} shadow-level-1`}
                >
                  <span className="text-primary">{step.icon}</span>
                </div>
                <div className="absolute -top-1 -right-1 flex size-6 items-center justify-center rounded-full bg-primary ios-caption-2 text-primary-foreground shadow-level-1">
                  {step.number}
                </div>
              </div>
              <h3 className="font-semibold text-lg">{t(step.titleKey)}</h3>
              <p className="ios-body max-w-xs text-muted-foreground">{t(step.descKey)}</p>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}
