"use client";

import BookOpen01Icon from "@hugeicons/core-free-icons/BookOpen01Icon";
import BrainIcon from "@hugeicons/core-free-icons/BrainIcon";
import ChartUpIcon from "@hugeicons/core-free-icons/ChartUpIcon";
import GlobeIcon from "@hugeicons/core-free-icons/GlobeIcon";
import Target01Icon from "@hugeicons/core-free-icons/Target01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { useTranslations } from "next-intl";
import { motionEase } from "@/lib/utils/animation";

const bentoConfig = [
  {
    icon: BookOpen01Icon,
    titleKey: "featurePastPapers",
    descKey: "featurePastPapersDesc",
    accentColor: "text-chart-4",
    colSpan: "lg:col-span-2",
    small: true,
  },
  {
    icon: Target01Icon,
    titleKey: "featurePlanner",
    descKey: "featurePlannerDesc",
    accentColor: "text-primary",
    colSpan: "lg:col-span-2",
    small: true,
  },
  {
    icon: ChartUpIcon,
    titleKey: "featureTracking",
    descKey: "featureTrackingDesc",
    accentColor: "text-chart-2",
    colSpan: "lg:col-span-4",
    panorama: true,
  },
  {
    icon: GlobeIcon,
    titleKey: "featureOffline",
    descKey: "featureOfflineDesc",
    accentColor: "text-chart-3",
    colSpan: "lg:col-span-2",
    small: true,
  },
];

function ImageBentoCard() {
  const t = useTranslations("home");

  return (
    <m.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: 0, duration: 0.6, ease: motionEase }}
      className="md:col-span-2 md:row-span-2"
    >
      <div className="group relative h-full min-h-64 overflow-hidden rounded-card border border-border/30 bg-card shadow-level-1 transition-[box-shadow,background-color,border-color] duration-500 hover:shadow-level-3 md:min-h-80">
        <div
          className="absolute inset-0 scale-105 bg-cover bg-center opacity-20 mix-blend-luminosity transition-transform duration-700 group-hover:scale-110 img-outline"
          style={{ backgroundImage: "url(https://picsum.photos/seed/learning/800/600)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card/95 via-card/60 to-card/30" />
        <div className="relative flex h-full flex-col justify-end gap-3 p-6 md:p-8">
          <div className="flex size-12 items-center justify-center rounded-xl bg-(--system-accent-alpha-10) text-primary transition-transform duration-300 group-hoverable:scale-110">
            <HugeiconsIcon icon={BrainIcon} className="size-6" />
          </div>
          <h3 className="text-2xl font-bold text-foreground tracking-tight">
            {t("featureAIPractice")}
          </h3>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            {t("featureAIPracticeDesc")}
          </p>
        </div>
      </div>
    </m.div>
  );
}

export function FeaturesGrid() {
  const t = useTranslations("home");
  const prefersReducedMotion = useReducedMotion();

  const smallCards = bentoConfig.filter((c) => c.colSpan !== "md:col-span-2 md:row-span-2");

  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-4">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.4 }}
          className="mb-12 flex flex-col gap-3"
        >
          <h2 className="text-3xl font-extrabold text-foreground tracking-tight md:text-4xl">
            {t("featuresHeading")}
          </h2>
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
            {t("featuresSubheading")}
          </p>
        </m.div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:grid-flow-dense lg:grid-cols-4">
          <ImageBentoCard />

          {smallCards.map((card, i) => (
            <m.div
              key={card.titleKey}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                delay: prefersReducedMotion ? 0 : (i + 1) * 0.08,
                duration: 0.6,
                ease: motionEase,
              }}
              className={card.colSpan}
            >
              {card.panorama ? (
                <div className="group relative h-full min-h-48 overflow-hidden rounded-card border border-border/30 bg-card shadow-level-1 transition-[box-shadow,background-color,border-color] duration-500 hover:shadow-level-3">
                  <div
                    className="absolute inset-0 scale-105 bg-cover bg-center opacity-15 mix-blend-luminosity transition-transform duration-700 group-hover:scale-110 img-outline"
                    style={{ backgroundImage: "url(https://picsum.photos/seed/progress/1200/400)" }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-card/50 to-card/20" />
                  <div className="relative flex h-full flex-col justify-end gap-3 p-6 md:p-8">
                    <div
                      className={`flex size-11 items-center justify-center rounded-xl bg-(--system-accent-alpha-10) ${card.accentColor} transition-transform duration-300 group-hoverable:scale-110`}
                    >
                      <HugeiconsIcon icon={card.icon} className="size-5" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground tracking-tight">
                      {t(card.titleKey)}
                    </h3>
                    <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                      {t(card.descKey)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="group relative h-full overflow-hidden rounded-card border border-border/30 bg-card p-6 shadow-level-1 transition-[box-shadow,background-color,border-color] duration-500 hover:shadow-level-3">
                  <div className="absolute inset-0 bg-gradient-to-br from-system-accent/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <div className="relative flex flex-col gap-3">
                    <div
                      className={`flex size-10 items-center justify-center rounded-xl bg-(--system-accent-alpha-10) ${card.accentColor} transition-transform duration-300 group-hoverable:scale-110`}
                    >
                      <HugeiconsIcon icon={card.icon} className="size-5" />
                    </div>
                    <h3 className="text-base font-bold text-foreground tracking-tight">
                      {t(card.titleKey)}
                    </h3>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {t(card.descKey)}
                    </p>
                  </div>
                </div>
              )}
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}
