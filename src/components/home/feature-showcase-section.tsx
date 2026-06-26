"use client";

import BookOpen01Icon from "@hugeicons/core-free-icons/BookOpen01Icon";
import BrainIcon from "@hugeicons/core-free-icons/BrainIcon";
import BulbIcon from "@hugeicons/core-free-icons/BulbIcon";
import ChartBarIcon from "@hugeicons/core-free-icons/BarChartIcon";
import GlobeIcon from "@hugeicons/core-free-icons/GlobeIcon";
import Target01Icon from "@hugeicons/core-free-icons/Target01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface ShowcaseFeature {
  icon: typeof BrainIcon;
  titleKey: string;
  descKey: string;
  accent: string;
}

const features: ShowcaseFeature[] = [
  {
    icon: BrainIcon,
    titleKey: "home.showcaseAiQuiz",
    descKey: "home.showcaseAiQuizDesc",
    accent: "before:bg-(--system-accent-alpha-10)",
  },
  {
    icon: BookOpen01Icon,
    titleKey: "home.showcasePapers",
    descKey: "home.showcasePapersDesc",
    accent: "before:bg-chart-4/10",
  },
  {
    icon: BulbIcon,
    titleKey: "home.showcaseFlashcards",
    descKey: "home.showcaseFlashcardsDesc",
    accent: "before:bg-chart-3/10",
  },
  {
    icon: ChartBarIcon,
    titleKey: "home.showcaseAnalytics",
    descKey: "home.showcaseAnalyticsDesc",
    accent: "before:bg-chart-2/10",
  },
  {
    icon: Target01Icon,
    titleKey: "home.showcasePlanner",
    descKey: "home.showcasePlannerDesc",
    accent: "before:bg-chart-5/10",
  },
  {
    icon: GlobeIcon,
    titleKey: "home.showcaseShare",
    descKey: "home.showcaseShareDesc",
    accent: "before:bg-chart-1/10",
  },
];

export function FeatureShowcaseSection() {
  const t = useTranslations();
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="relative py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={prefersReducedMotion ? undefined : { duration: 0.4 }}
          className="mb-16 text-center"
        >
          <h2 className="ios-title-1 mb-3">{t("home.showcaseHeading")}</h2>
          <p className="ios-body mx-auto max-w-lg text-muted-foreground">
            {t("home.showcaseSubheading")}
          </p>
        </m.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <m.div
              key={feature.titleKey}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={prefersReducedMotion ? undefined : { delay: i * 0.05, duration: 0.4 }}
              className={cn(
                "group relative before:pointer-events-none before:absolute before:inset-0 before:rounded-lg before:opacity-0 before:transition-opacity before:duration-300 group-hover:before:opacity-100",
                feature.accent,
              )}
            >
              <div className="relative flex flex-col gap-4 rounded-lg border border-border/50 bg-system-background-secondary p-6 shadow-level-1">
                <div className="flex size-10 items-center justify-center rounded-md bg-(--system-accent-alpha-10)">
                  <HugeiconsIcon icon={feature.icon} className="size-5 text-primary" />
                </div>
                <div>
                  <h3 className="mb-2 font-semibold text-base sm:text-lg">{t(feature.titleKey)}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed sm:text-base">
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
