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
import { motionEase } from "@/lib/utils/animation";

const featureConfig: {
  icon: typeof BrainIcon;
  titleKey: string;
  descKey: string;
  bg: string;
  accentColor: string;
}[] = [
  {
    icon: BrainIcon,
    titleKey: "featureAIPractice",
    descKey: "featureAIPracticeDesc",
    bg: "bg-linear-to-br from-(--system-accent-alpha-10) to-transparent",
    accentColor: "text-primary",
  },
  {
    icon: BookOpen01Icon,
    titleKey: "featurePastPapers",
    descKey: "featurePastPapersDesc",
    bg: "bg-chart-4/5",
    accentColor: "text-chart-4",
  },
  {
    icon: BarChartIcon,
    titleKey: "featureTracking",
    descKey: "featureTrackingDesc",
    bg: "bg-system-background-secondary",
    accentColor: "text-primary",
  },
  {
    icon: BulbIcon,
    titleKey: "featureFlashcards",
    descKey: "featureFlashcardsDesc",
    bg: "bg-chart-3/5",
    accentColor: "text-chart-3",
  },
  {
    icon: Target01Icon,
    titleKey: "featurePlanner",
    descKey: "featurePlannerDesc",
    bg: "bg-system-background-secondary",
    accentColor: "text-primary",
  },
  {
    icon: GlobeIcon,
    titleKey: "featureOffline",
    descKey: "featureOfflineDesc",
    bg: "bg-chart-2/5",
    accentColor: "text-chart-2",
  },
];

export function FeaturesGrid() {
  const t = useTranslations("home");
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={prefersReducedMotion ? undefined : { duration: 0.4 }}
          className="flex flex-col gap-3 mb-14 max-w-2xl"
        >
          <h2 className="ios-title-1 font-bold text-foreground tracking-tight">
            {t("featuresHeading")}
          </h2>
          <p className="ios-body max-w-lg text-muted-foreground">{t("featuresSubheading")}</p>
        </m.div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {featureConfig.map((feature, i) => (
            <m.div
              key={feature.titleKey}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={
                prefersReducedMotion
                  ? undefined
                  : { delay: i * 0.08, duration: 0.6, ease: motionEase }
              }
            >
              <div
                className={`group relative h-full rounded-card border border-border/40 p-7 shadow-level-1 transition-[box-shadow,border-color,transform] duration-500 hover:shadow-level-3 hover:border-primary/20 hover:-translate-y-1 ${feature.bg}`}
              >
                <div className="flex flex-col gap-3">
                  <div
                    className={`flex size-12 items-center justify-center rounded-xl bg-(--system-accent-alpha-10) ${feature.accentColor} transition-[scale,rotate,background-color,box-shadow] duration-300 group-hoverable:scale-125 group-hover:rotate-[6deg]`}
                  >
                    <HugeiconsIcon icon={feature.icon} className="size-6" />
                  </div>
                  <h3 className="font-bold text-base">{t(feature.titleKey)}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {t(feature.descKey)}
                  </p>
                </div>
              </div>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}
