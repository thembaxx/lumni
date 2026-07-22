"use client";

import BookOpen01Icon from "@hugeicons/core-free-icons/BookOpen01Icon";
import ChartUpIcon from "@hugeicons/core-free-icons/ChartUpIcon";
import Target01Icon from "@hugeicons/core-free-icons/Target01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { useTranslations } from "next-intl";

const stepsConfig = [
  {
    icon: BookOpen01Icon,
    titleKey: "howStep1Title",
    descKey: "howStep1Desc",
    image: "https://picsum.photos/seed/subjects/800/600",
  },
  {
    icon: Target01Icon,
    titleKey: "howStep2Title",
    descKey: "howStep2Desc",
    image: "https://picsum.photos/seed/practice-ai/800/600",
  },
  {
    icon: ChartUpIcon,
    titleKey: "howStep3Title",
    descKey: "howStep3Desc",
    image: "https://picsum.photos/seed/track-progress/800/600",
  },
];

export function HowItWorksSection() {
  const t = useTranslations("home");
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-system-background-secondary py-24 md:py-36">
      <div className="pointer-events-none absolute top-1/2 left-1/2 size-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/6 blur-3xl" />
      <div className="pointer-events-none absolute -top-40 -right-40 size-80 rounded-full bg-chart-4/5 blur-3xl" />

      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col gap-16 md:flex-row md:gap-24">
          <div className="md:sticky md:top-32 md:h-fit md:w-72 md:shrink-0 lg:w-80">
            <m.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.4 }}
              className="flex flex-col gap-5"
            >
              <div className="flex h-1 w-10 rounded-full bg-primary" />
              <h2 className="text-3xl font-extrabold text-foreground text-balance tracking-tight md:text-4xl">
                {t("howHeading")}
              </h2>
              <p className="text-pretty text-base leading-relaxed text-muted-foreground">
                {t("howSubheading")}
              </p>
            </m.div>
          </div>

          <div className="flex flex-1 flex-col gap-10">
            {stepsConfig.map((step, i) => (
              <m.div
                key={step.titleKey}
                initial={{ opacity: 0, scale: 0.92 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{
                  duration: prefersReducedMotion ? 0 : 0.8,
                  delay: prefersReducedMotion ? 0 : i * 0.12,
                  ease: [0.175, 0.885, 0.32, 1.1],
                }}
                className="group overflow-hidden rounded-card-lg border border-border/20 bg-card shadow-level-1 transition-[box-shadow,border-color] duration-500 hover:shadow-level-3"
              >
                <div className="grid md:grid-cols-2">
                  <div className="order-2 flex flex-col justify-center gap-3 p-6 md:order-1 md:p-8">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-(--system-accent-alpha-10)">
                      <HugeiconsIcon icon={step.icon} className="size-5 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground text-balance tracking-tight">
                      {t(step.titleKey)}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {t(step.descKey)}
                    </p>
                  </div>
                  <div className="order-1 aspect-4/3 overflow-hidden md:order-2 md:aspect-auto md:min-h-72">
                    <div
                      className="h-full w-full scale-105 bg-cover bg-center transition-transform duration-700 group-hover:scale-110 img-outline"
                      style={{ backgroundImage: `url(${step.image})` }}
                    />
                  </div>
                </div>
              </m.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
