"use client";

import BarChartIcon from "@hugeicons/core-free-icons/BarChartIcon";
import BookOpen01Icon from "@hugeicons/core-free-icons/BookOpen01Icon";
import BrainIcon from "@hugeicons/core-free-icons/BrainIcon";
import BulbIcon from "@hugeicons/core-free-icons/BulbIcon";
import GlobeIcon from "@hugeicons/core-free-icons/GlobeIcon";
import Target01Icon from "@hugeicons/core-free-icons/Target01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { motionEase } from "@/lib/utils/animation";

const featureConfig: {
  icon: typeof BrainIcon;
  titleKey: string;
  descKey: string;
  color: string;
  span: string;
  highlight?: string;
}[] = [
  {
    icon: BrainIcon,
    titleKey: "featureAIPractice",
    descKey: "featureAIPracticeDesc",
    color: "from-primary/10 to-primary/5",
    span: "sm:col-span-2 lg:col-span-3",
    highlight: "AI-powered",
  },
  {
    icon: BookOpen01Icon,
    titleKey: "featurePastPapers",
    descKey: "featurePastPapersDesc",
    color: "from-chart-4/10 to-chart-4/5",
    span: "lg:col-span-3",
    highlight: "Past papers",
  },
  {
    icon: BarChartIcon,
    titleKey: "featureTracking",
    descKey: "featureTrackingDesc",
    color: "from-chart-2/10 to-chart-2/5",
    span: "sm:col-span-2 lg:col-span-4",
  },
  {
    icon: BulbIcon,
    titleKey: "featureFlashcards",
    descKey: "featureFlashcardsDesc",
    color: "from-chart-3/10 to-chart-3/5",
    span: "sm:col-span-2 lg:col-span-4",
  },
  {
    icon: Target01Icon,
    titleKey: "featurePlanner",
    descKey: "featurePlannerDesc",
    color: "from-chart-5/10 to-chart-5/5",
    span: "lg:col-span-2",
  },
  {
    icon: GlobeIcon,
    titleKey: "featureOffline",
    descKey: "featureOfflineDesc",
    color: "from-primary/10 to-chart-4/5",
    span: "lg:col-span-2",
  },
];

export function FeaturesGrid() {
  const t = useTranslations("home");
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-transparent via-system-accent/2 to-transparent" />
      <div className="mx-auto max-w-6xl px-4">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={prefersReducedMotion ? undefined : { duration: 0.4 }}
          className="flex flex-col gap-4 mb-14 text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-(--system-accent-alpha-10) px-3 py-1 text-xs text-primary">
            <span className="relative flex size-2">
              {!prefersReducedMotion && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              )}
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            Everything you need
          </div>
          <h2 className="ios-title-1 font-extrabold text-foreground tracking-tight">
            {t("featuresHeading")}
          </h2>
          <p className="ios-body mx-auto max-w-lg text-muted-foreground">
            {t("featuresSubheading")}
          </p>
        </m.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {featureConfig.map((feature, i) => (
            <m.div
              key={feature.titleKey}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={
                prefersReducedMotion
                  ? undefined
                  : { delay: i * 0.08, duration: 0.5, ease: motionEase }
              }
              className={feature.span}
            >
              <div
                className={cn(
                  "group relative h-full overflow-hidden rounded-card border border-border/40 bg-card p-7 shadow-level-1 transition-all duration-500 hover:shadow-level-3",
                  "hover:border-primary/20 hover:-translate-y-1",
                )}
              >
                <div
                  className={cn(
                    "pointer-events-none absolute inset-0 bg-linear-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-100",
                    feature.color,
                  )}
                />
                <div className="pointer-events-none absolute -right-12 -top-12 size-32 rounded-full bg-primary/3 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:bg-primary/8" />

                <div className="relative z-elevated flex flex-col gap-3">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-(--system-accent-alpha-10) text-primary transition-all duration-300 group-hover:scale-125 group-hover:rotate-[6deg] group-hover:bg-(--system-accent-alpha-20) group-hover:shadow-level-2">
                    <HugeiconsIcon icon={feature.icon} className="size-6" />
                  </div>
                  <h3 className="font-bold text-base">{t(feature.titleKey)}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {t(feature.descKey)}
                  </p>
                </div>

                <div className="absolute right-4 bottom-4 flex h-10 w-10 items-center justify-center rounded-full border border-border/30 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:bg-(--system-accent-alpha-10) group-hover:border-primary/20">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 14 14"
                    fill="none"
                    className="text-primary"
                  >
                    <path
                      d="M1 13L13 1M13 1H4M13 1V10"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}
